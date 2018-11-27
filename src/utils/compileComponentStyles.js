/* eslint-disable no-debugger, no-unused-vars */
import React from 'react';
import { mapKeys, compact, identity, pickBy, camelCase, pick } from 'lodash';
import ReactDOMServer from 'react-dom/server';
import type { ReactNode } from '../types';
import Context from './Context';

export const getComponentClasses = (node: ReactNode, context: Context) => {
  // TODO:
  //  use context to get the parent node
  // then use the append the parent class to classes to get
  // the styles for child elements (ex. "Card hr", "ol li")
  const classes: Array<String> =
    node && node.type && (node.props && node.props.className)
      ? [node.type, ...node.props.className.split(' ')]
      : [node.type];

  return compact(classes);
};

// gets the rendered styles from the stylesheets attached to storybook
export const getComponentStyles = (node: ReactNode, stylesheet: any = {}, TreeContext: Context) => {
  const styleDecls = getComponentClasses(node, TreeContext);
  // concatenate all the styles together by
  // reversing the class order
  // then merging them left to right to mimic css class inheritance and specificity
  return Object.assign({}, ...styleDecls.map(decl => stylesheet[decl]));
};
