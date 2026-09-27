import { FlatList, type FlatListProps, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { SectionHeader } from './section-header';

interface HorizontalListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  readonly title?: string;
  readonly onSeeAll?: () => void;
  readonly renderItem: FlatListProps<T>['renderItem'];
}

export function HorizontalList<T>({ title, onSeeAll, ...flatListProps }: HorizontalListProps<T>) {
  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
