/**
 * Type definitions for GDevelop Core (gdcore-tools).
 * These are partial types based on the GDCore API.
 */

export interface GDVersion {
  major: number;
  minor: number;
  build: number;
  revision: number;
}

export interface GDProject {
  getName(): string;
  setName(name: string): void;
  getVersion(): string;
  setVersion(version: string): void;
  getDescription(): string;
  setDescription(description: string): void;
  getAuthor(): string;
  setAuthor(author: string): void;
  getPackageName(): string;
  setPackageName(packageName: string): void;

  // Window settings
  getMainWindowDefaultWidth(): number;
  setDefaultWidth(width: number): void;
  getMainWindowDefaultHeight(): number;
  setDefaultHeight(height: number): void;
  getMaximumFPS(): number;
  setMaximumFPS(fps: number): void;
  getMinimumFPS(): number;
  setMinimumFPS(fps: number): void;

  // Layouts
  getLayoutsCount(): number;
  hasLayoutNamed(name: string): boolean;
  getLayout(name: string): GDLayout;
  getLayoutAt(index: number): GDLayout;
  insertNewLayout(name: string, position: number): GDLayout;
  removeLayout(name: string): void;
  getLayoutPosition(name: string): number;
  moveLayout(oldIndex: number, newIndex: number): void;
  getFirstLayout(): string;
  setFirstLayout(name: string): void;

  // Global objects
  getObjects(): GDObjectsContainer;
  getObjectsCount(): number;
  hasObjectNamed(name: string): boolean;
  getObject(name: string): GDObject;
  createObject(type: string, name: string): GDObject;
  insertObject(object: GDObject, position: number): void;
  removeObject(name: string): void;

  // Global variables
  getVariables(): GDVariablesContainer;

  // Object groups
  getObjectGroups(): GDObjectGroupsContainer;

  // External events
  getExternalEventsCount(): number;
  hasExternalEventsNamed(name: string): boolean;
  getExternalEvents(name: string): GDExternalEvents;
  insertNewExternalEvents(name: string, position: number): GDExternalEvents;
  removeExternalEvents(name: string): void;

  // External layouts
  getExternalLayoutsCount(): number;
  hasExternalLayoutNamed(name: string): boolean;
  getExternalLayout(name: string): GDExternalLayout;
  insertNewExternalLayout(name: string, position: number): GDExternalLayout;
  removeExternalLayout(name: string): void;

  // Extensions
  getUsedExtensions(): GDVectorString;
  addUsedExtension(name: string): void;
  removeUsedExtension(name: string): void;

  // Platform
  getCurrentPlatform(): GDPlatform;

  // Resources
  getResourcesManager(): GDResourcesManager;

  // Serialization
  serializeTo(element: GDSerializerElement): void;
  unserializeFrom(element: GDSerializerElement): void;

  delete(): void;
}

export interface GDLayout {
  getName(): string;
  setName(name: string): void;
  getBackgroundColorRed(): number;
  getBackgroundColorGreen(): number;
  getBackgroundColorBlue(): number;
  setBackgroundColor(r: number, g: number, b: number): void;

  // Objects
  getObjects(): GDObjectsContainer;
  hasObjectNamed(name: string): boolean;
  getObject(name: string): GDObject;
  createObject(type: string, name: string): GDObject;
  insertObject(object: GDObject, position: number): void;
  removeObject(name: string): void;

  // Instances
  getInitialInstances(): GDInitialInstancesContainer;

  // Variables
  getVariables(): GDVariablesContainer;

  // Events
  getEvents(): GDEventsList;

  // Layers
  getLayersCount(): number;
  getLayerAt(index: number): GDLayer;
  hasLayerNamed(name: string): boolean;
  getLayer(name: string): GDLayer;
  insertNewLayer(name: string, position: number): GDLayer;
  removeLayer(name: string): void;
  moveLayer(oldIndex: number, newIndex: number): void;

  // Object groups
  getObjectGroups(): GDObjectGroupsContainer;

  delete(): void;
}

export interface GDObject {
  getName(): string;
  setName(name: string): void;
  getType(): string;

  // Behaviors
  getAllBehaviorNames(): string[];
  hasBehaviorNamed(name: string): boolean;
  getBehavior(name: string): GDBehavior;
  addNewBehavior(project: GDProject, type: string, name: string): GDBehavior;
  removeBehavior(name: string): void;

  // Variables
  getVariables(): GDVariablesContainer;

  // Effects
  getEffects(): GDEffectsContainer;

  // Serialization
  serializeTo(element: GDSerializerElement): void;
  unserializeFrom(project: GDProject, element: GDSerializerElement): void;

  delete(): void;
}

export interface GDBehavior {
  getName(): string;
  setName(name: string): void;
  getTypeName(): string;
  getProperties(): GDMapStringPropertyDescriptor;
  updateProperty(name: string, value: string): boolean;
}

export interface GDMapStringPropertyDescriptor {
  keys(): string[];
  get(key: string): GDPropertyDescriptor;
}

export interface GDPropertyDescriptor {
  getValue(): string;
  setValue(value: string): void;
  getType(): string;
  getLabel(): string;
  getDescription(): string;
}

export interface GDObjectsContainer {
  getObjectsCount(): number;
  hasObjectNamed(name: string): boolean;
  getObject(name: string): GDObject;
  getObjectAt(index: number): GDObject;
  getObjectPosition(name: string): number;
  insertObject(object: GDObject, position: number): void;
  removeObject(name: string): void;
  moveObject(oldIndex: number, newIndex: number): void;
}

export interface GDVariablesContainer {
  count(): number;
  has(name: string): boolean;
  get(name: string): GDVariable;
  getAt(index: number): GDVariable;
  getNameAt(index: number): string;
  insertNew(name: string, position: number): GDVariable;
  remove(name: string): void;
  rename(oldName: string, newName: string): void;
  move(oldIndex: number, newIndex: number): void;
}

export interface GDVariable {
  getName(): string;
  setName(name: string): void;
  getString(): string;
  setString(value: string): void;
  getValue(): number;
  setValue(value: number): void;
  getBool(): boolean;
  setBool(value: boolean): void;
  getType(): number; // 0=number, 1=string, 2=structure, 3=array, 4=boolean
  setType(type: number): void;
  getChildrenCount(): number;
  getChild(name: string): GDVariable;
  hasChild(name: string): boolean;
  removeChild(name: string): void;
  getAllChildrenNames(): string[];
}

export interface GDInitialInstancesContainer {
  getInstancesCount(): number;
  iterateOverInstances(callback: (instance: GDInitialInstance) => void): void;
  insertNewInitialInstance(): GDInitialInstance;
  removeInstance(instance: GDInitialInstance): void;
  removeAllInstancesOnLayer(layerName: string): void;
  removeInitialInstancesOfObject(objectName: string): void;
  moveInstancesToLayer(fromLayer: string, toLayer: string): void;
  renameInstancesOfObject(oldName: string, newName: string): void;
}

export interface GDInitialInstance {
  getObjectName(): string;
  setObjectName(name: string): void;
  getX(): number;
  setX(x: number): void;
  getY(): number;
  setY(y: number): void;
  getZ(): number;
  setZ(z: number): void;
  getAngle(): number;
  setAngle(angle: number): void;
  getZOrder(): number;
  setZOrder(zOrder: number): void;
  getLayer(): string;
  setLayer(layer: string): void;
  isLocked(): boolean;
  setLocked(locked: boolean): void;
  hasCustomSize(): boolean;
  setHasCustomSize(hasCustomSize: boolean): void;
  getCustomWidth(): number;
  setCustomWidth(width: number): void;
  getCustomHeight(): number;
  setCustomHeight(height: number): void;
  isFlippedX(): boolean;
  setFlippedX(flipped: boolean): void;
  isFlippedY(): boolean;
  setFlippedY(flipped: boolean): void;
  getVariables(): GDVariablesContainer;
}

export interface GDEventsList {
  getEventsCount(): number;
  getEventAt(index: number): GDBaseEvent;
  insertNewEvent(project: GDProject, type: string, position: number): GDBaseEvent;
  insertEvent(event: GDBaseEvent, position: number): void;
  removeEvent(event: GDBaseEvent): void;
  removeEventAt(index: number): void;
  moveEvent(event: GDBaseEvent, newIndex: number): void;
  moveEventToAnotherEventsList(
    event: GDBaseEvent,
    targetList: GDEventsList,
    newIndex: number
  ): void;
  clear(): void;
}

export interface GDBaseEvent {
  getType(): string;
  isExecutable(): boolean;
  canHaveSubEvents(): boolean;
  hasSubEvents(): boolean;
  getSubEvents(): GDEventsList;
  isDisabled(): boolean;
  setDisabled(disabled: boolean): void;
  isFolded(): boolean;
  setFolded(folded: boolean): void;
  clone(): GDBaseEvent;
  delete(): void;
}

export interface GDStandardEvent extends GDBaseEvent {
  getConditions(): GDInstructionsList;
  getActions(): GDInstructionsList;
}

export interface GDInstructionsList {
  size(): number;
  get(index: number): GDInstruction;
  insert(instruction: GDInstruction, position: number): void;
  remove(instruction: GDInstruction): void;
  removeAt(index: number): void;
  clear(): void;
}

export interface GDInstruction {
  getType(): string;
  setType(type: string): void;
  isInverted(): boolean;
  setInverted(inverted: boolean): void;
  getParametersCount(): number;
  getParameter(index: number): string;
  setParameter(index: number, value: string): void;
  setParametersCount(count: number): void;
  getSubInstructions(): GDInstructionsList;
  clone(): GDInstruction;
  delete(): void;
}

export interface GDLayer {
  getName(): string;
  setName(name: string): void;
  getVisibility(): boolean;
  setVisibility(visible: boolean): void;
  isLocked(): boolean;
  setLocked(locked: boolean): void;
  isLightingLayer(): boolean;
  setLightingLayer(isLighting: boolean): void;
  getAmbientLightColorRed(): number;
  getAmbientLightColorGreen(): number;
  getAmbientLightColorBlue(): number;
  setAmbientLightColor(r: number, g: number, b: number): void;
  getCamerasCount(): number;
  getEffects(): GDEffectsContainer;
}

export interface GDEffectsContainer {
  getEffectsCount(): number;
  hasEffectNamed(name: string): boolean;
  getEffect(name: string): GDEffect;
  getEffectAt(index: number): GDEffect;
  insertNewEffect(name: string, position: number): GDEffect;
  removeEffect(name: string): void;
  moveEffect(oldIndex: number, newIndex: number): void;
}

export interface GDEffect {
  getName(): string;
  setName(name: string): void;
  getEffectType(): string;
  setEffectType(type: string): void;
  getAllDoubleParameters(): Map<string, number>;
  getAllStringParameters(): Map<string, string>;
  getAllBooleanParameters(): Map<string, boolean>;
  setDoubleParameter(name: string, value: number): void;
  setStringParameter(name: string, value: string): void;
  setBooleanParameter(name: string, value: boolean): void;
}

export interface GDObjectGroupsContainer {
  count(): number;
  has(name: string): boolean;
  get(name: string): GDObjectGroup;
  insert(group: GDObjectGroup, position: number): void;
  remove(name: string): void;
}

export interface GDObjectGroup {
  getName(): string;
  setName(name: string): void;
  getObjectsCount(): number;
  getObjectAt(index: number): string;
  addObject(objectName: string): void;
  removeObject(objectName: string): void;
  find(objectName: string): boolean;
}

export interface GDExternalEvents {
  getName(): string;
  setName(name: string): void;
  getAssociatedLayout(): string;
  setAssociatedLayout(name: string): void;
  getEvents(): GDEventsList;
}

export interface GDExternalLayout {
  getName(): string;
  setName(name: string): void;
  getAssociatedLayout(): string;
  setAssociatedLayout(name: string): void;
  getInitialInstances(): GDInitialInstancesContainer;
}

export interface GDResourcesManager {
  getAllResourceNames(): string[];
  hasResource(name: string): boolean;
  getResource(name: string): GDResource;
  addResource(resource: GDResource): void;
  removeResource(name: string): void;
  renameResource(oldName: string, newName: string): void;
}

export interface GDResource {
  getName(): string;
  setName(name: string): void;
  getKind(): string;
  getFile(): string;
  setFile(file: string): void;
  getMetadata(): string;
  setMetadata(metadata: string): void;
}

export interface GDSerializerElement {
  delete(): void;
}

export interface GDVectorString {
  size(): number;
  at(index: number): string;
  push_back(value: string): void;
  clear(): void;
}

export interface GDPlatform {
  getName(): string;
  getFullName(): string;
}

export interface GDSerializer {
  toJSON(element: GDSerializerElement): string;
  fromJSON(json: string): GDSerializerElement;
}

/**
 * The GD namespace object returned by gdcore-tools.
 */
export interface GD {
  Project: new () => GDProject;
  Instruction: new () => GDInstruction;
  ObjectGroup: new () => GDObjectGroup;
  SerializerElement: new () => GDSerializerElement;
  Serializer: GDSerializer;
  Variable: new () => GDVariable;

  // Event handlers
  on?(event: 'print', callback: (message: string) => void): void;
  on?(event: 'error', callback: (message: string) => void): void;
}

/**
 * The wrapped GD tools object returned by gdcore-tools.
 */
export interface GDTools {
  gd: GD;
  loadProject(path: string): Promise<GDProject>;
  saveProject(project: GDProject, fileName?: string, filePath?: string): Promise<void>;
  exportProject?: (
    project: GDProject,
    outputDir: string,
    exportTarget?: ExportTarget
  ) => void;
  runtimePath?: string;
  localFileSystem?: unknown;
  gd_internal_logs?: string;
  getRuntimePath?: () => string;
}

export type ExportTarget = 'electron' | 'cordova' | 'facebookInstantGames';
