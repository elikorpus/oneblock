import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, HeartHandshake, Landmark, Map as MapIcon, Sun, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { TourOverlay, TourRect } from '../components/TourOverlay';
import { hasSeenTour, markTourSeen } from '../lib/tourStorage';
import { theme } from '../theme';
import { AskScreen } from '../screens/Ask';
import { DiscoverScreen } from '../screens/Discover';
import { EventsScreen } from '../screens/Events';
import { HOAScreen } from '../screens/HOA';
import { MeetScreen } from '../screens/Meet';
import { TodayScreen } from '../screens/Today';
import { AppStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, React.ComponentType<{ size: number; color: string }>> = {
  Today: Sun,
  Meet: Users,
  Ask: HeartHandshake,
  Events: Calendar,
  Discover: MapIcon,
  HOA: Landmark,
};

const TOUR_STEPS: { key: keyof TabParamList; title: string; body: string }[] = [
  { key: 'Today', title: 'This is Today', body: "See what's happening on your street — events, news, and updates from your neighbors." },
  { key: 'Meet', title: 'Meet your neighbors', body: 'Browse who lives nearby, see their page, and say hello.' },
  { key: 'Ask', title: 'Ask for help', body: 'Borrow something, ask a favor, or get a recommendation from a neighbor.' },
  { key: 'Events', title: 'See events', body: 'Browse upcoming get-togethers and RSVP with one tap.' },
  { key: 'Discover', title: 'Discover the neighborhood', body: 'See the map, the Yellow Pages, and local businesses your neighbors recommend.' },
  { key: 'HOA', title: 'Your HOA', body: 'Read announcements from the board and send them a message.' },
];

/** The inside of a tab button — shared with the tour so the spotlight can draw
 * an exact copy of the tab it's pointing at. */
function TabButtonContent({ name, focused }: { name: keyof TabParamList; focused: boolean }) {
  const Icon = ICONS[name];
  return (
    <>
      <View style={[styles.iconPill, focused && { backgroundColor: theme.colors.grass }]}>
        <Icon size={18} color={focused ? '#fff' : theme.colors.inkSoft} />
      </View>
      <Text style={[styles.tabLabel, { color: focused ? theme.colors.ink : theme.colors.inkSoft }]}>{name}</Text>
    </>
  );
}

type CustomTabBarProps = BottomTabBarProps & {
  containerRef: React.RefObject<View | null>;
  /** Bump to force a re-measure (container resized, tour opened, …). */
  measureKey: string;
  onMeasureTabs: (rects: Record<string, TourRect>) => void;
};

function CustomTabBar({ state, navigation, containerRef, measureKey, onMeasureTabs }: CustomTabBarProps) {
  const itemRefs = useRef<Record<string, View | null>>({});

  // Measure each tab *relative to the app container* rather than the window:
  // on web the window and the phone-shaped frame the app is pinned inside are
  // two different boxes, and they shift apart whenever browser chrome appears.
  const routeNames = state.routes.map((r) => r.name).join(',');
  const measureAll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.measureInWindow((cx, cy) => {
      const names = routeNames.split(',');
      const next: Record<string, TourRect> = {};
      let pending = names.length;
      const done = () => {
        pending -= 1;
        if (pending === 0) onMeasureTabs(next);
      };
      names.forEach((name) => {
        const node = itemRefs.current[name];
        if (!node) return done();
        node.measureInWindow((x, y, width, height) => {
          next[name] = { x: x - cx, y: y - cy, width, height };
          done();
        });
      });
    });
  }, [containerRef, onMeasureTabs, routeNames]);

  useEffect(() => {
    measureAll();
  }, [measureAll, measureKey]);

  return (
    <View style={styles.tabBar} onLayout={measureAll}>
      {state.routes.map((route, index) => (
        <Pressable
          key={route.key}
          ref={(el) => {
            itemRefs.current[route.name] = el;
          }}
          onLayout={measureAll}
          onPress={() => navigation.navigate(route.name)}
          style={styles.tabItem}
        >
          <TabButtonContent name={route.name as keyof TabParamList} focused={state.index === index} />
        </Pressable>
      ))}
    </View>
  );
}

export function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [targets, setTargets] = useState<Record<string, TourRect>>({});
  const containerRef = useRef<View>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    let cancelled = false;
    hasSeenTour().then((seen) => {
      if (cancelled || seen) return;
      setTimeout(() => {
        if (!cancelled) setTourActive(true);
      }, 500);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finishTour = () => {
    setTourActive(false);
    markTourSeen();
  };

  const nextTourStep = () => {
    if (tourStep >= TOUR_STEPS.length - 1) {
      finishTour();
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const step = TOUR_STEPS[tourStep];

  return (
    <View style={styles.container} ref={containerRef} onLayout={onContainerLayout}>
      <AppHeader
        onOpenNotifications={() => navigation.navigate('Notifications')}
        onOpenProfile={() => navigation.navigate('Profile')}
      />
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            containerRef={containerRef}
            measureKey={`${containerHeight}:${tourActive}`}
            onMeasureTabs={setTargets}
          />
        )}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Meet" component={MeetScreen} />
        <Tab.Screen name="Ask" component={AskScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="HOA" component={HOAScreen} />
      </Tab.Navigator>
      <TourOverlay
        visible={tourActive}
        steps={TOUR_STEPS}
        stepIndex={tourStep}
        targetRect={(step && targets[step.key]) ?? null}
        containerHeight={containerHeight}
        spotlight={
          step ? (
            <View style={styles.spotlightTab}>
              <TabButtonContent name={step.key} focused />
            </View>
          ) : null
        }
        onNext={nextTourStep}
        onSkip={finishTour}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.paper },
  tabBar: {
    borderTopWidth: theme.border.width,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  iconPill: { borderRadius: theme.radius.pill, paddingVertical: 6, paddingHorizontal: 14 },
  tabLabel: { fontSize: 10, fontFamily: theme.font.bodyBold },
  spotlightTab: { alignItems: 'center', gap: 4 },
});
