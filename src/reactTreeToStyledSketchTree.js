/* edslint-disable */
import htmlTagsMap from './utils/htmlTagsMap';
import { INHERITABLE_FONT_STYLES } from './utils/constants';
import { find, flatten, has, isObject, pick, omit } from 'lodash';
import { getComponentStyles } from './utils/compileComponentStyles';

const traverse = require('traverse');

// push all tags to a list of json objects
// [{html: <DOM_node_tag_name>, sketchComponent: <sketch_component>}, ...]
const HTML2SketchComponentsMap = [];
for (let sketchComponent in htmlTagsMap) {
  HTML2SketchComponentsMap.push(
    ...htmlTagsMap[sketchComponent].map(tag => ({ html: tag, sketchComponent })),
  );
}

const nodeHas = (node, props) => isObject(node) && has(node, props);

const getSketchComponentType = node => {
  if (nodeHas(node, ['type'])) {
    const tag = find(HTML2SketchComponentsMap, { html: node.type });
    return tag || null;
  } else {
    return null;
  }
};

const convertHTMLInnerTextToSketchNode = tree => {
  let reactTree = traverse(tree).forEach(function(node) {
    let isTextNode = node && node.type == 'text';
    let nodeHasInnerTextChildren =
      node && node.children && node.children.length && !node.children[0].type;
    if (!isTextNode && nodeHasInnerTextChildren) {
      let style = node.props.style ? pick(node.props.style, INHERITABLE_FONT_STYLES) : {};
      this.update(
        {
          ...node,
          children: [
            {
              type: 'text',
              props: { style: { ...style, width: '100%' } },
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

const isHTMLnode = node => {
  if (nodeHas(node, ['type'])) {
    return flatten(Object.values(htmlTagsMap)).includes(node.type);
  } else {
    return false;
  }
};

const hydrateTreeWithStyleProps = (tree, globalStyles) => {
  let reactTree = traverse(tree).forEach(function(node) {
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
        let compStyles = omit(getComponentStyles(node, globalStyles, this), ['overflow']);

        // FINALLY
        //  update the node style props with the compiled styles
        this.update({ ...node, props: { ...node.props, style: compStyles } });
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
  return reactTree;
};

export const ReactTreeToStyledSketchTree = (tree, globalStyles = {}) => {
  let reactTree = tree;
  const styles = globalStyles;
  const treeWithStyleProps = hydrateTreeWithStyleProps(reactTree, styles);
  const treeWithTextNodes = convertHTMLInnerTextToSketchNode(treeWithStyleProps);
  const StyledSketchTree = convertTreeToSketchComponents(treeWithTextNodes);
  return StyledSketchTree;
};
