import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, LoadingView } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository, preferenceRepository } from '@/data/repositories';
import type { ProfileId } from '@/types/domain';

import { CountryStep } from '@/features/profile/onboarding/CountryStep';
import { LanguageStep } from '@/features/profile/onboarding/LanguageStep';
import { CategoryStep } from '@/features/profile/onboarding/CategoryStep';
import { HomeStep } from '@/features/profile/onboarding/HomeStep';

type Step = 'welcome' | 'country' | 'language' | 'category' | 'home';
const STEPS: Step[] = ['welcome', 'country', 'language', 'category', 'home'];

export default function ProfileOnboardingScreen() {
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const boot = useSessionStore((s) => s.boot);
  
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Preferences State
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [homeSections, setHomeSections] = useState<string[]>([]);

  const currentStep = STEPS[stepIndex];

  async function finishOnboarding() {
    if (!id) return;
    setLoading(true);
    try {
      const profileId = id as ProfileId;

      // Save preferences
      await preferenceRepository.set(profileId, 'countries', countries);
      await preferenceRepository.set(profileId, 'languages', languages);
      await preferenceRepository.set(profileId, 'categories', categories);
      await preferenceRepository.set(profileId, 'home_sections', homeSections);

      // Mark onboarding complete
      await profileRepository.setOnboardingCompleted(profileId, true);
      const profile = await profileRepository.getById(profileId);
      
      if (profile) {
        boot({ status: 'ready', profile });
        router.replace('/(tabs)');
      } else {
        router.replace('/profile/select' as any);
      }
    } catch {
      Alert.alert('Error', 'Failed to complete onboarding.');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      void finishOnboarding();
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  function handleSkip() {
    void finishOnboarding();
  }

  if (loading) return <LoadingView message="Completing setup…" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
        
        {/* Stepper / Progress Indicator */}
        <View style={styles.stepperContainer}>
          {STEPS.map((step, idx) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                {
                  backgroundColor: idx <= stepIndex ? colors.primary : colors.border,
                  flex: idx <= stepIndex ? 2 : 1,
                },
              ]}
            />
          ))}
        </View>

        <ThemedText variant="headlineLarge" style={styles.title}>
          {currentStep === 'welcome' && 'Welcome!'}
          {currentStep === 'country' && 'Select Countries'}
          {currentStep === 'language' && 'Select Languages'}
          {currentStep === 'category' && 'Select Categories'}
          {currentStep === 'home' && 'Configure Home'}
        </ThemedText>

        {currentStep === 'welcome' && (
          <View style={styles.center}>
            <ThemedText style={{ textAlign: 'center' }}>
              Let&apos;s set up your profile preferences so we can recommend the best content for you.
            </ThemedText>
          </View>
        )}

        {currentStep === 'country' && (
          <CountryStep selectedCountries={countries} onChange={setCountries} />
        )}

        {currentStep === 'language' && (
          <LanguageStep selectedLanguages={languages} onChange={setLanguages} />
        )}

        {currentStep === 'category' && (
          <CategoryStep selectedCategories={categories} onChange={setCategories} />
        )}

        {currentStep === 'home' && (
          <HomeStep selectedSections={homeSections} onChange={setHomeSections} />
        )}
      </View>

      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }]}>
        <View style={styles.primaryActions}>
          <Button 
            variant="outline" 
            onPress={handleBack} 
            disabled={stepIndex === 0} 
            style={styles.actionButton}
          >
            <ThemedText variant="button">Back</ThemedText>
          </Button>
          <Button onPress={handleNext} style={styles.actionButton}>
            <ThemedText variant="button" themeColor="primaryText">
              {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
            </ThemedText>
          </Button>
        </View>
        
        <View style={styles.secondaryActions}>
          <Button variant="ghost" onPress={handleNext} style={styles.skipStepButton}>
            <ThemedText variant="button">Skip Step</ThemedText>
          </Button>
          <Button variant="ghost" onPress={handleSkip}>
            <ThemedText variant="button">Skip All</ThemedText>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, marginTop: 40 },
  stepperContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    height: 4,
    justifyContent: 'center',
    width: '100%',
  },
  stepDot: {
    height: 4,
    borderRadius: 2,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { textAlign: 'center', marginBottom: 24, textTransform: 'capitalize' },
  footer: { paddingTop: 16, gap: 16 },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  actionButton: { flex: 1 },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  skipStepButton: {
    flex: 1,
    marginRight: 8,
  }
});
