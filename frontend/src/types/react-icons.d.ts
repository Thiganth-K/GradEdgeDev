import 'react-icons';
import React from 'react';

declare module 'react-icons' {
  interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
}
