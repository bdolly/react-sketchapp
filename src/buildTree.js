// @flow
import * as TestRenderer from 'react-test-renderer';
import * as yoga from 'yoga-layout';
import Context from './utils/Context';
import type { TreeNode } from './types';
import hasAnyDefined from './utils/hasAnyDefined';
import pick from './utils/pick';
import computeYogaTree from './jsonUtils/computeYogaTree';
import computeTextTree from './jsonUtils/computeTextTree';
import { INHERITABLE_FONT_STYLES } from './utils/constants';
import zIndex from './utils/zIndex';
import htmlTagsMap from './utils/htmlTagsMap';
import { find } from 'lodash';

var traverse = require('traverse');

export const reactTreeToFlexTree = (node: TreeNode, yogaNode: yoga.Yoga$Node, context: Context) => {
  debug('5. buildTree:reactTreeToFlexTree');
  let textNodes;
  let textStyle = context.getInheritedStyles();
  const style = node.props && node.props.style ? node.props.style : {};
  const type = node.type || 'text';
  debug(`5. buildTree:reactTreeToFlexTree - node.type = ${node.type}`);
  let newChildren = [];

  if (type === 'svg') {
    newChildren = node.children;
  } else if (type === 'text') {
    // If current node is a Text node, add text styles to Context to pass down to
    // child nodes.
    if (node.props && node.props.style && hasAnyDefined(style, INHERITABLE_FONT_STYLES)) {
      const inheritableStyles = pick(style, INHERITABLE_FONT_STYLES);
      inheritableStyles.flexDirection = 'row';
      context.addInheritableStyles(inheritableStyles);
      textStyle = {
        ...context.getInheritedStyles(),
        ...inheritableStyles,
      };
    }

    // Compute Text Children
    textNodes = computeTextTree(node, context);
  } else if (node.children && node.children.length > 0) {
    // Recursion reverses the render stacking order
    // but that's actually fine because Sketch renders the first on top

    // Calculates zIndex order to match yoga
    const children = zIndex(node.children);

    for (let index = 0; index < children.length; index += 1) {
      const childComponent = children[index];

      const childNode = yogaNode.getChild(index);

      const renderedChildComponent = reactTreeToFlexTree(
        childComponent,
        childNode,
        context.forChildren(),
      );
      newChildren.push(renderedChildComponent);
    }
  }

  return {
    type,
    style,
    textStyle,
    layout: {
      left: yogaNode.getComputedLeft(),
      right: yogaNode.getComputedRight(),
      top: yogaNode.getComputedTop(),
      bottom: yogaNode.getComputedBottom(),
      width: yogaNode.getComputedWidth(),
      height: yogaNode.getComputedHeight(),
    },
    props: {
      ...node.props,
      textNodes,
    },
    children: newChildren,
  };
};

const getSketchComponentType = node => {
  // push all tags to a list of json objects
  // [{html: <DOM_node_tag_name>, sketchComponent: <sketch_component>}, ...]

  let tags = [];
  for (let sketchComponent in htmlTagsMap) {
    tags.push(...htmlTagsMap[sketchComponent].map(tag => ({ html: tag, sketchComponent })));
  }
  // TODO: add htmlTagsMap blacklist error here
  const tag = find(tags, { html: node.type });

  return tag || null;
};

const convertHTMLInnerText = tree => {
  // logJSON(tree);
  let reactTree = traverse(tree).forEach(function(node) {
    let nodeHasChildren = node.children && node.children.length;
    // convert HTML innerText elements to skteh <Text> component representation
    if (node && node.type !== 'text') {
      if (nodeHasChildren) {
        let style = node.props.style ? pick(node.props.style, INHERITABLE_FONT_STYLES) : {};
        this.update(
          {
            ...node,
            children: [
              {
                type: 'text',
                props: { style },
                children: [node.children[0]],
              },
            ],
          },
          true,
        );
      }
    }
  });
  return reactTree;
};

const convertTreeToSketchComponents = tree => {
  let reactTree = traverse(tree).forEach(function(node) {
    const isNode = node && node.type;
    if (isNode) {
      let sType = getSketchComponentType(node);
      if (sType && sType.sketchComponent != 'BLACKLIST') {
        // TODO: lookup and add component and children styles
        this.update({ ...node, type: sType.sketchComponent });
      }
    }
  });
  logJSON(reactTree);
  return reactTree;
};

const buildTree = (element: React$Element<any>): TreeNode => {
  debug('2. buildTree:buildTree()');

  const renderer = TestRenderer.create(element);
  const json: TreeNode = renderer.toJSON();
  const treeWithTextNodes = convertHTMLInnerText(json);
  convertTreeToSketchComponents(treeWithTextNodes);
  const yogaNode = computeYogaTree(json, new Context());

  yogaNode.calculateLayout(undefined, undefined, yoga.DIRECTION_LTR);
  const tree = reactTreeToFlexTree(json, yogaNode, new Context());

  return tree;
};

export default buildTree;
