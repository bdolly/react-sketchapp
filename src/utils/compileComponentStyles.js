/* eslint-disable no-debugger, no-unused-vars */
import React from 'react';
import { mapKeys, compact, identity, pickBy, camelCase, pick, isObject, has } from 'lodash';
import ReactDOMServer from 'react-dom/server';
import type { ReactNode } from '../types';
import Context from './Context';
const traverse = require('traverse');

const updateNestedNodeStyles = (parentNode: ReactNode, stylesheet) => {
  if (parentNode && parentNode.children && parentNode.children.every(x => isObject(x))) {
    const parentClasses = parentNode.props?.className?.split(' ') || null;
    const baseClass =
      parentClasses && !parentClasses[0].includes('--') ? parentClasses[0] : parentNode.type;

    const tree = traverse(parentNode).forEach(function(child) {
      if (isObject(child) && has(child, 'type')) {
        this.update({
          ...child,
          props: {
            style: { ...stylesheet[`${baseClass} ${child.type}`], ...child.props.style },
            ...child.props,
          },
        });
      }
    });
    return tree;
  }

  return parentNode;
};

export const getComponentClasses = (node: ReactNode, context: Context) => {
  // TODO:
  //  use context to get the parent node
  // then use the append the parent class to classes to get
  // the styles for child elements (ex. "Card hr", "ol li")
  const parent = context.notRoot && !context.isCircular ? context.parent.node : null;

  const classes: Array<String> =
    node && node.type && (node.props && node.props.className)
      ? [node.type, ...node.props.className.split(' ')]
      : [node.type];

  return compact(classes);
};

// gets the rendered styles from the stylesheets attached to storybook
export const getComponentStyles = (node: ReactNode, stylesheet: any = {}, TreeContext: Context) => {
  let tree = node;
  // adds styles to nested nodes
  tree = updateNestedNodeStyles(node, stylesheet);

  let styleDecls = getComponentClasses(tree, TreeContext);

  // concatenate all the styles together by
  // reversing the class order
  // then merging them left to right to mimic css class inheritance and specificity
  return Object.assign({}, ...styleDecls.map(decl => stylesheet[decl]), node?.props?.style || {});
};
