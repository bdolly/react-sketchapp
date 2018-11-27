// @flow
/* eslint-disable func-names, import/prefer-default-export */
import { find, flatten, has, isObject, pick, omit } from 'lodash';
import htmlTagsMap, { HTML2SketchComponentsMap } from './utils/htmlTagsMap';
import { INHERITABLE_FONT_STYLES } from './utils/constants';
import { getComponentStyles } from './utils/compileComponentStyles';
import type { ReactNode } from './types';

const traverse = require('traverse');

type HTMLTagMapping = {
  html: String,
  sketchComponent: String,
};

const nodeHas: Boolean = (node, props) => isObject(node) && has(node, props);

const getSketchComponentMapping: HTMLTagMapping = node => {
  const comp = nodeHas(node, ['type'])
    ? find(HTML2SketchComponentsMap, { html: node.type }) || null
    : null;
  return comp;
};

const convertHTMLInnerTextToSketchNode = tree => {
  const reactTree: ReactNode = traverse(tree).forEach(function(node) {
    const isTextNode: Boolean = nodeHas(node, ['type']) && node.type == 'text';

    const nodeHasInnerTextChildren: Boolean =
      node && node.children && node.children.length && !node.children[0].type;

    if (!isTextNode && nodeHasInnerTextChildren) {
      const style = node.props.style ? pick(node.props.style, INHERITABLE_FONT_STYLES) : {};
      this.update(
        {
          ...node,
          children: [
            {
              type: 'text',
              props: { style: { ...style } },
              children: [node.children[0]],
            },
          ],
        },
        true,
      );
    }
  });
  return reactTree;
};

const isHTMLnode: Boolean = node => {
  let isHTML = nodeHas(node, ['type'])
    ? flatten(Object.values(htmlTagsMap)).includes(node.type)
    : null;
  return isHTML;
};

const hydrateTreeWithStyleProps: ReactNode = (tree: ReactNode, globalStyles: any = {}) => {
  let reactTree: ReactNode = traverse(tree).forEach(function(node) {
    // for each node in tree
    //    get the components css classes
    if (isHTMLnode(node) && nodeHas(node, ['props'])) {
      let sType = find(HTML2SketchComponentsMap, { html: node.type });
      if (
        sType &&
        !['document', 'page', 'artboard'].includes(sType.html) &&
        sType.sketchComponent !== 'BLACKLIST'
      ) {
        // THEN
        //    parse the globalStyles by
        //  first
        //    getting all styles associated with the html element
        //  second
        //    getting all the styles associated with the css classes

        // remove the overflow property as is causes sketch to mask all the layers
        const compStyles = omit(getComponentStyles(node, globalStyles, this), ['overflow']);

        // FINALLY
        //  update the node style props with the compiled styles
        this.update({ ...node, props: { ...node.props, style: compStyles } });
      }
    }
  });
  return reactTree;
};

// convert all the node.type over to sketch components
const convertTreeToSketchComponents: ReactNode = (tree: ReactNode) => {
  const reactTree = traverse(tree).forEach(function(node) {
    if (nodeHas(node, ['type'])) {
      const sType = getSketchComponentMapping(node);
      if (sType && sType.sketchComponent != 'BLACKLIST') {
        // TODO: lookup and add component and children styles
        this.update({ ...node, type: sType.sketchComponent });
      }
    }
  });
  return reactTree;
};

export const ReactTreeToStyledSketchTree = (tree: ReactNode, globalStyles: any = {}) => {
  const reactTree = tree;
  const styles = globalStyles;
  const treeWithStyleProps = hydrateTreeWithStyleProps(reactTree, styles);
  logJSON(treeWithStyleProps);
  const treeWithTextNodes = convertHTMLInnerTextToSketchNode(treeWithStyleProps);
  const StyledSketchTree = convertTreeToSketchComponents(treeWithTextNodes);
  return StyledSketchTree;
};
