/* eslint-disable */
import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {LocalFileSource} from '@dekkai/data-source/build/lib/file/types';
import {data, graph} from '../../../src/mod';
import alphaShape from 'https://cdn.skypack.dev/alpha-shape';

export interface LayoutInfo {
    nodes: string;
    nodesFile: File;
    nodeAtts: string;
    nodeAttsFile: File;
    nodeLayout: string;
    nodeLayoutFile: File;
    groups: string;
    groupsFile: File;
    alpha: number;
    level: number;
    levelCount: number;
    maxLabelLength: number;
    topGroupThreshold: number;
    pointRadius: number;
    positionScale: number;
}

export interface GroupColor {
    id: string;
    level: number;
    primary: number;
    inherited: Set<number> | number[];
    top: boolean;
}

export interface GroupCentroid {
    id: string;
    point: string;
    label: string;
    color: number;
    level: number;
    top: boolean;
}

export interface GroupHullEdge {
    id: string;
    source: string;
    target: string;
    sourceColor: number;
    targetColor: number;
    group: string;
    level: number;
}

export interface KnowledgeNodeData extends graph.nodes.BasicNodeData {
    level: number;
}

export interface GraferData {
    points: data.PointData[];
    nodes: KnowledgeNodeData[];
    shapes: GroupHullEdge[];
    colors: GroupColor[];
    centroids: GroupCentroid[];
}

async function parseJSONL(input: LocalFileSource, cb: (d: any) => void): Promise<void> {
    const file = await DataFile.fromLocalSource(input);

    // load 16MB chunks
    const sizeOf16MB = 16 * 1024 * 1024;
    const byteLength = await file.byteLength;
    const decoder = new TextDecoder();
    const lineBreak = '\n'.charCodeAt(0);

    for(let offset = 0; offset <= byteLength; offset += sizeOf16MB) {
        const chunkEnd = Math.min(offset + sizeOf16MB, byteLength);
        const chunk = await file.loadData(offset, chunkEnd);
        const view = new DataView(chunk);
        let start = 0;
        for (let i = 0, n = chunk.byteLength; i < n; ++i) {
            if (view.getUint8(i) === lineBreak || offset + i === byteLength) {
                const statementBuffer = new Uint8Array(chunk, start, i - start);
                start = i + 1;

                const str = decoder.decode(statementBuffer);
                const json = JSON.parse(str);

                cb(json);
            }
        }

        if (start < chunk.byteLength) {
            offset -= chunk.byteLength - start;
        }

        // console.log(`${chunkEnd} / ${byteLength} - ${((chunkEnd/byteLength) * 100).toFixed(2)}%`);
    }
}

export async function convertDataToGraferV4(info: LayoutInfo): Promise<GraferData> {
    let lineNumber;

    // variable to hold the number of colors used
    let colorIndex = 0;

    // load the points
    console.log('Loading points...');
    const points: Map<string, data.PointData> = new Map();
    lineNumber = 0;
    await parseJSONL(info.nodeLayoutFile, json => {
        if (lineNumber++) {
            points.set(json.node_id, {
                id: json.node_id,
                x: json.coors[0] * info.positionScale,
                y: json.coors[1] * info.positionScale,
                z: 0,
                radius: info.pointRadius,
            });
        }
    });

    // load the groups per levels
    console.log('Loading groups...');
    const groupLevels = [];
    const centroids: Map<string, GroupCentroid> = new Map();
    const groups = new Map();
    lineNumber = 0;
    await parseJSONL(info.groupsFile, json => {
        if (lineNumber++) {
            const level = json.level;
            while (level >= groupLevels.length) {
                groupLevels.push([]);
            }
            groupLevels[level].push(json);
            groups.set(json.id, json);
            centroids.set(json.id, {
                id: json.id,
                point: json.node_id_centroid,
                label: '',
                color: colorIndex++,
                level: json.level,
                top: false,
            });
        }
    });

    console.log('Loading node attributes...');
    const noiseNodes = [];
    const nodeLevelMap = new Map();
    lineNumber = 0;
    await parseJSONL(info.nodeAttsFile, json => {
        if (lineNumber++) {
            const groupIDs = json.group_ids;
            if (groupIDs) {
                for (const groupID of groupIDs) {
                    const group = groups.get(groupID);
                    if (!group.computedChildren) {
                        group.computedChildren = [];
                    }
                    group.computedChildren.push(json.node_id);
                }
                nodeLevelMap.set(json.node_id, groups.get(groupIDs[groupIDs.length - 1]).level);
            } else {
                noiseNodes.push(json.node_id);
                nodeLevelMap.set(json.node_id, -1);
            }
        }
    });

    console.log(`Sorting group levels: ${groupLevels.length}`);
    for (let i = 0, n = groupLevels.length; i < n; ++i) {
        console.log(`Level ${i}: ${groupLevels[i].length}`);
        groupLevels[i].sort((a, b) => b.computedChildren.length - a.computedChildren.length);
        const l = [];
        for (const group of groupLevels[i]) {
            l.push(group.computedChildren.length);
            if (group.computedChildren.length > info.topGroupThreshold) {
                centroids.get(group.id).top = true;
                group.top = true;
            } else {
                group.top = false;
            }
        }
        console.log(l);
    }

    // compute color indices
    console.log('Computing color indices...');
    const nodeColors: Map<string, number> = new Map(); // holds the color index of each node
    const groupColors: Map<string, GroupColor> = new Map(); // holds an array of colors belonging to each cluster
    // start with the noise nodes
    for (const id of noiseNodes) {
        nodeColors.set(id, colorIndex);
    }
    // iterate through the cluster from the highest level to the lowest and assign colors
    for (let i = groupLevels.length - 1; i >= 0; --i) {
        for (const group of groupLevels[i]) {
            let colors = groupColors.get(group.id);
            if (!colors) {
                colors = {
                    id: group.id,
                    level: i,
                    primary: ++colorIndex,
                    inherited: new Set(),
                    top: group.top,
                };
                groupColors.set(group.id, colors);
            }
            for (const nodeID of group.computedChildren) {
                if (nodeColors.has(nodeID)) {
                    (colors.inherited as Set<number>).add(nodeColors.get(nodeID));
                } else {
                    nodeColors.set(nodeID, colors.primary);
                }
            }
        }
    }

    // convert the group inherited colors set to arrays
    for (const colors of groupColors.values()) {
        colors.inherited = Array.from(colors.inherited);
    }

    console.log('Loading nodes...');
    const nodes: KnowledgeNodeData[] = [];
    const nodeMap = new Map();
    lineNumber = 0;
    await parseJSONL(info.nodesFile, json => {
        if (lineNumber++) {
            nodes.push({
                id: json.id,
                point: json.id,
                color: nodeColors.get(json.id),
                // label: json.name.substr(0, 25),
                level: nodeLevelMap.get(json.id),
            });
            nodeMap.set(json.id, json);
        }
    });

    console.log('Computing labels...');
    for (const group of groups.values()) {
        const node = nodeMap.get(group.node_id_centroid);
        const label = node.name.length > info.maxLabelLength + 3 ? `${node.name.substr(0, info.maxLabelLength)}...` : node.name;
        centroids.get(group.id).label = label;
    }

    // compute alpha shapes
    console.log('Computing alpha shapes...');
    const shapes: GroupHullEdge[] = [];
    // HACK: Only compute the specified level. Once this is a backend pipeline all levels should be computed.
    for (let i = 0, n = groupLevels.length; i < n; ++i)
    {
        // const i = info.level;
        console.log(`Level ${i}...`);
        console.log('0%');
        for (let ii = 0, nn = groupLevels[i].length; ii < nn; ++ii) {
            const group = groupLevels[i][ii];
            const coors = [];
            for (const node of group.computedChildren) {
                const point = points.get(node);
                coors.push([point.x / info.positionScale, point.y / info.positionScale]);
            }
            const cells = alphaShape(info.alpha, coors);
            for (const cell of cells) {
                const cellPoints = [];
                for (let i = 0, n = cell.length; i < n; ++i) {
                    const id = `s_${points.size}_${n}`;
                    points.set(id, {
                        id,
                        x: coors[cell[i]][0] * info.positionScale,
                        y: coors[cell[i]][1] * info.positionScale,
                        z: 0,
                        radius: 1,
                    });
                    cellPoints.push(id);
                }

                if (cellPoints.length > 2) {
                    throw `Cells with more than 2 points are not supported. ${cell.toString()}`;
                } else {
                    shapes.push({
                        id: `s_${shapes.length}`,
                        source: cellPoints[0],
                        target: cellPoints[1],
                        sourceColor: nodeColors.get(group.node_id_centroid),
                        targetColor: nodeColors.get(group.node_id_centroid),
                        group: group.node_id_centroid,
                        level: i,
                    });
                }
            }
            console.log(`${Math.floor(((ii + 1) / nn) * 100)}%`);
        }
    }
    console.log(shapes);

    console.log(`TOTAL COLORS: ${colorIndex}`);

    return {
        points: [...points.values()],
        nodes,
        shapes,
        colors: [...groupColors.values()],
        centroids: [...centroids.values()],
    };
}

