// @flow
import { BorderPosition, FillType } from 'sketch-constants';
import type { SJShapeGroupLayer } from 'sketchapp-json-flow-types';
import { makeColorFromCSS } from './models';
import type { ViewStyle, LayoutInfo } from '../types';
import same from '../utils/same';
import { makeVerticalBorder, makeHorizontalBorder } from './shapeLayers';
import { makeBorderOptions } from './style';

const DEFAULT_BORDER_COLOR = 'transparent';
const DEFAULT_BORDER_STYLE = 'solid';

/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/prefer-default-export
export const createBorders = (
  content: SJShapeGroupLayer,
  layout: LayoutInfo,
  style?: ViewStyle,
): Array<SJShapeGroupLayer> => {
  if (!style) {
    return [content];
  }

  const {
    borderTopWidth = style?.borderWidth || 0,
    borderRightWidth = style?.borderWidth || 0,
    borderBottomWidth = style?.borderWidth || 0,
    borderLeftWidth = style?.borderWidth || 0,

    borderTopColor = style?.borderColor || DEFAULT_BORDER_COLOR,
    borderRightColor = style?.borderColor || DEFAULT_BORDER_COLOR,
    borderBottomColor = style?.borderColor || DEFAULT_BORDER_COLOR,
    borderLeftColor = style?.borderColor || DEFAULT_BORDER_COLOR,

    borderTopStyle = style?.borderStyle || DEFAULT_BORDER_STYLE,
    borderRightStyle = style?.borderStyle || DEFAULT_BORDER_STYLE,
    borderBottomStyle = style?.borderStyle || DEFAULT_BORDER_STYLE,
    borderLeftStyle = style?.borderStyle || DEFAULT_BORDER_STYLE,
  } = style;

  if (
    same(borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth) &&
    same(borderTopColor, borderRightColor, borderBottomColor, borderLeftColor) &&
    same(borderTopStyle, borderRightStyle, borderBottomStyle, borderLeftStyle)
  ) {
    // all sides have same border width
    // in this case, we can do everything with just a single shape.
    if (borderTopStyle !== undefined) {
      const borderOptions = makeBorderOptions(borderTopStyle, borderTopWidth);
      if (borderOptions) {
        content.style.borderOptions = borderOptions;
      }
    }

    if (borderTopWidth > 0) {
      content.style.borders = [
        {
          _class: 'border',
          isEnabled: true,
          color: makeColorFromCSS(borderTopColor),
          fillType: FillType.Solid,
          position: BorderPosition.Inside,
          thickness: borderTopWidth,
        },
      ];
    }

    return [content];
  }

  content.hasClippingMask = true;

  const layers = [content];

  if (borderTopWidth > 0) {
    const topBorder = makeHorizontalBorder(0, 0, layout.width, borderTopWidth, borderTopColor);
    topBorder.name = 'Border (top)';

    const borderOptions = makeBorderOptions(borderTopStyle, borderTopWidth);
    if (borderOptions) {
      topBorder.style.borderOptions = borderOptions;
    }

    layers.push(topBorder);
  }

  if (borderRightWidth > 0) {
    const rightBorder = makeVerticalBorder(
      layout.width - borderRightWidth,
      0,
      layout.height,
      borderRightWidth,
      borderRightColor,
    );
    rightBorder.name = 'Border (right)';

    const borderOptions = makeBorderOptions(borderRightStyle, borderRightWidth);
    if (borderOptions) {
      rightBorder.style.borderOptions = borderOptions;
    }

    layers.push(rightBorder);
  }

  if (borderBottomWidth > 0) {
    const bottomBorder = makeHorizontalBorder(
      0,
      layout.height - borderBottomWidth,
      layout.width,
      borderBottomWidth,
      borderBottomColor,
    );
    bottomBorder.name = 'Border (bottom)';

    const borderOptions = makeBorderOptions(borderBottomStyle, borderBottomWidth);
    if (borderOptions) {
      bottomBorder.style.borderOptions = borderOptions;
    }

    layers.push(bottomBorder);
  }

  if (borderLeftWidth > 0) {
    const leftBorder = makeVerticalBorder(0, 0, layout.height, borderLeftWidth, borderLeftColor);
    leftBorder.name = 'Border (left)';

    const borderOptions = makeBorderOptions(borderLeftStyle, borderLeftWidth);
    if (borderOptions) {
      leftBorder.style.borderOptions = borderOptions;
    }

    layers.push(leftBorder);
  }

  return layers;
};
