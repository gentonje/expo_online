import * as React from 'react';
import { View } from 'react-native';

interface ProductGridProps<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}

export default function ProductGrid<T extends { id: string | number }>({ items, renderItem }: ProductGridProps<T>) {
    return (
        <View className="flex-row flex-wrap p-2">
            {items.map((item) => (
                <View
                    key={item.id}
                    className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6 p-1"
                >
                    {renderItem(item)}
                </View>
            ))}
        </View>
    );
}
