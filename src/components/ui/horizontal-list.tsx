import { FlatList, type FlatListProps, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { SectionHeader } from './section-header';

interface HorizontalListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  readonly title?: string;
  readonly onSeeAll?: () => void;
  readonly renderItem: FlatListProps<T>['renderItem'];
}

export function HorizontalList<T>({ title, onSeeAll, ...flatListProps }: HorizontalListProps<T>) {
  return (
    <View style={styles.wrapper}>
      {title && (
        <SectionHeader
          title={title}
          onSeeAll={onSeeAll}
          seeAllLabel={onSeeAll ? 'See All' : undefined}
          style={styles.header}
        />
      )}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        {...flatListProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});
