/* eslint-disable no-debugger, no-unused-vars */
import React from 'react';
import { mapKeys, compact, identity, pickBy, camelCase, pick } from 'lodash';
import ReactDOMServer from 'react-dom/server';

export const getComponentClasses = node => {
  let classes =
    node && node.type && (node.props && node.props.className)
      ? [node.type, ...node.props.className.split(' ')]
      : [node.type];

  return compact(classes);
};

// gets the rendered styles from the stylesheets attached to storybook
export const getComponentStyles = (node, stylesheet) => {
  // const stylesheets = getDocumentStylesheets();

  const styleDecls = getComponentClasses(node);
  // concatenate all the styles together by
  // reversing the class order
  // then merging them left to right to mimic css class inheritance and specificity
  return Object.assign({}, ...styleDecls.map(decl => stylesheet[decl]));
};
