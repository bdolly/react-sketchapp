// @flow
import * as renderers from './renderers';
import type { TreeNode } from './types';
import htmlTagsMap from './utils/htmlTagsMap';
import { find } from 'lodash';
const flexToSketchJSON = (node: TreeNode) => {
  const { type, style, textStyle, layout, props, children } = node;
  debug('9.1 flexToSketchJSON: ' + type);
  // push all tags to a list of json objects
  let tags = [];
  for (let sketchEl in htmlTagsMap) {
    tags.push(...htmlTagsMap[sketchEl].map(tag => ({ html: tag, renderer: sketchEl, sketchEl })));
  }
  // TODO: add htmlTagsMap blacklist error here
  // TODO: figure out text tree use cases
  let renderType = find(tags, { html: type }) ? find(tags, { html: type }).renderer : type;
  debug(`9.1.1 flexToSketchJSON render ${type} => ${renderType} with "renderers[${type}]"`);

  const Renderer = renderers[renderType];
  if (Renderer == null) {
    // Give some insight as to why there might be issues
    // specific to Page and Document components or SVG components
    let additionalNotes = '';
    if (type === 'document') {
      additionalNotes = '\nBe sure to only have <Page> components as children of <Document>.';
    } else if (type.indexOf('svg') === 0) {
      // the svg renderer should stop the walk down the tree so it shouldn't happen
      additionalNotes = '\nBe sure to always have <Svg.*> components as children of <Svg>.';
    }
    throw new Error(`Could not find renderer for type '${type}'. ${additionalNotes}`);
  }

  const renderer = new Renderer();
  const groupLayer = renderer.renderGroupLayer(layout, style, textStyle, props);
  const backingLayers = renderer.renderBackingLayers(layout, style, textStyle, props, children);

  // stopping the walk down the tree if we have an svg
  const sublayers =
    children && type !== 'svg' ? children.map(child => flexToSketchJSON(child)) : [];

  // Filter out anything null, undefined
  const layers = [...backingLayers, ...sublayers].filter(l => l);
  return { ...groupLayer, layers };
};

export default flexToSketchJSON;
