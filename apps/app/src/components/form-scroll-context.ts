import { createContext, RefObject } from 'react';
import { ScrollViewInstance } from 'react-native';

export const FormScroll = createContext<RefObject<ScrollViewInstance | null> | null>(null);
