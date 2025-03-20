import { AllowedComponentProps } from 'vue';
import { ArbitraryTypedObject } from '@portabletext/types';
import { Component } from 'vue';
import { ComponentCustomProps } from 'vue';
import { ToolkitListNestMode as ListNestMode } from '@portabletext/toolkit';
import { PortableTextBlock } from '@portabletext/types';
import { PortableTextBlockStyle } from '@portabletext/types';
import { PortableTextListItemBlock } from '@portabletext/types';
import { PortableTextListItemType } from '@portabletext/types';
import { PortableTextMarkDefinition } from '@portabletext/types';
import { PortableTextSpan } from '@portabletext/types';
import { RendererElement } from 'vue';
import { RendererNode } from 'vue';
import { ShallowUnwrapRef } from 'vue';
import { ToolkitPortableTextList } from '@portabletext/toolkit';
import { ToolkitPortableTextListItem } from '@portabletext/toolkit';
import { toPlainText } from '@portabletext/toolkit';
import { TypedObject } from '@portabletext/types';
import { VNode } from 'vue';
import { VNodeProps } from 'vue';

export declare const defaultComponents: PortableTextVueComponents;

/**
 * Component wrapper function to flatten props
 * @experimental
 * @todo inherit component props using generics
 */
export declare const flattenProps: <T>(component: Component, includeInternalProps?: boolean) => (props: PortableTextComponentProps<T>) => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>;

export { ListNestMode }

export declare function mergeComponents(parent: PortableTextVueComponents, overrides: PortableTextComponents): PortableTextVueComponents;

export declare type MissingComponentHandler = (message: string, options: {
    type: string;
    nodeType: NodeType;
}) => void;

/**
 * Function that renders any node that might appear in a portable text array or block,
 * including virtual "toolkit"-nodes like lists and nested spans
 */
export declare type NodeRenderer = <T extends TypedObject>(options: Serializable<T>) => VueNode;

export declare type NodeType = 'block' | 'mark' | 'blockStyle' | 'listStyle' | 'listItemStyle';

export declare const PortableText: <B extends TypedObject = PortableTextBlock<PortableTextMarkDefinition, ArbitraryTypedObject | PortableTextSpan, string, string>>(__VLS_props: {
    value: B | B[];
    components?: Partial<PortableTextVueComponents> | undefined;
    onMissingComponent?: false | MissingComponentHandler | undefined;
    listNestingMode?: ListNestMode | undefined;
} & VNodeProps & AllowedComponentProps & ComponentCustomProps, __VLS_ctx?: {
    attrs: any;
    slots: {};
    emit: any;
} | undefined, __VLS_expose?: ((exposed: ShallowUnwrapRef<    {}>) => void) | undefined, __VLS_setup?: Promise<{
    props: {
        value: B | B[];
        components?: Partial<PortableTextVueComponents> | undefined;
        onMissingComponent?: false | MissingComponentHandler | undefined;
        listNestingMode?: ListNestMode | undefined;
    } & VNodeProps & AllowedComponentProps & ComponentCustomProps;
    expose(exposed: ShallowUnwrapRef<    {}>): void;
    attrs: any;
    slots: {};
    emit: any;
}>) => VNode<RendererNode, RendererElement, {
[key: string]: any;
}> & {
    __ctx?: {
        props: {
            value: B | B[];
            components?: Partial<PortableTextVueComponents> | undefined;
            onMissingComponent?: false | MissingComponentHandler | undefined;
            listNestingMode?: ListNestMode | undefined;
        } & VNodeProps & AllowedComponentProps & ComponentCustomProps;
        expose(exposed: ShallowUnwrapRef<    {}>): void;
        attrs: any;
        slots: {};
        emit: any;
    } | undefined;
};

/**
 * Vue component type for rendering portable text blocks (paragraphs, headings, blockquotes etc)
 */
export declare type PortableTextBlockComponent = PortableTextComponent<PortableTextBlock>;

/**
 * Generic type for portable text rendering components that takes blocks/inline blocks
 *
 * @template N Node types we expect to be rendering (`PortableTextBlock` should usually be part of this)
 */
export declare type PortableTextComponent<N> = Component<PortableTextComponentProps<N>>;

/**
 * Props received by “flattened” Portable Text Components
 *
 * @template T Type of data this component will receive in its `value` property
 */
export declare type PortableTextComponentFlattenedProps<T extends Record<string, any>> = Omit<PortableTextComponentProps<T>, 'value'> & T;

/**
 * Props received by most Portable Text components
 *
 * @template T Type of data this component will receive in its `value` property
 */
export declare interface PortableTextComponentProps<T> {
    /**
     * Data associated with this portable text node, eg the raw JSON value of a block/type
     */
    value: T;
    /**
     * Index within its parent
     */
    index: number;
    /**
     * Whether or not this node is "inline" - ie as a child of a text block,
     * alongside text spans, or a block in and of itself.
     */
    isInline: boolean;
    /**
     * Function used to render any node that might appear in a portable text array or block,
     * including virtual "toolkit"-nodes like lists and nested spans. You will rarely need
     * to use this.
     */
    renderNode: NodeRenderer;
}

/**
 * Object defining the different Vue components to use for rendering various aspects
 * of Portable Text and user-provided types, where only the overrides needs to be provided.
 */
export declare type PortableTextComponents = Partial<PortableTextVueComponents>;

/**
 * Vue component type for rendering (virtual, not part of the spec) portable text lists
 */
export declare type PortableTextListComponent = PortableTextComponent<VuePortableTextList>;

/**
 * Vue component type for rendering portable text list items
 */
export declare type PortableTextListItemComponent = PortableTextComponent<PortableTextListItemBlock>;

/**
 * Vue component type for rendering portable text marks and/or decorators
 *
 * @template M The mark type we expect
 */
export declare type PortableTextMarkComponent<M extends TypedObject = any> = Component<PortableTextMarkComponentProps<M>>;

/**
 * Props received by Portable Text mark rendering components
 *
 * @template M Shape describing the data associated with this mark, if it is an annotation
 */
export declare interface PortableTextMarkComponentProps<M extends TypedObject = ArbitraryTypedObject> {
    /**
     * Mark definition, eg the actual data of the annotation. If the mark is a simple decorator, this will be `undefined`
     */
    value?: M;
    /**
     * Text content of this mark
     */
    text: string;
    /**
     * Key for this mark. The same key can be used amongst multiple text spans within the same block, so don't rely on this for Vue keys.
     */
    markKey?: string;
    /**
     * Type of mark - ie value of `_type` in the case of annotations, or the name of the decorator otherwise - eg `em`, `italic`.
     */
    markType: string;
    /**
     * Function used to render any node that might appear in a portable text array or block,
     * including virtual "toolkit"-nodes like lists and nested spans. You will rarely need
     * to use this.
     */
    renderNode: NodeRenderer;
}

/**
 * Properties for the Portable Text Vue component
 *
 * @template B Types that can appear in the array of blocks
 */
export declare interface PortableTextProps<B extends TypedObject = PortableTextBlock | ArbitraryTypedObject> {
    /**
     * One or more blocks to render
     */
    value: B | B[];
    /**
     * Vue components to use for rendering
     */
    components?: Partial<PortableTextVueComponents>;
    /**
     * Function to call when encountering unknown unknown types, eg blocks, marks,
     * block style, list styles without an associated Vue component.
     *
     * Will print a warning message to the console by default.
     * Pass `false` to disable.
     */
    onMissingComponent?: MissingComponentHandler | false;
    /**
     * Determines whether or not lists are nested inside of list items (`html`)
     * or as a direct child of another list (`direct` - for Vue Native)
     *
     * You rarely (if ever) need/want to customize this
     */
    listNestingMode?: ListNestMode;
}

export declare type PortableTextTypeComponent<V extends TypedObject = any> = Component<PortableTextComponentProps<V>>;

/**
 * Object definining the different Vue components to use for rendering various aspects
 * of Portable Text and user-provided types.
 */
export declare interface PortableTextVueComponents {
    /**
     * Object of Vue components that renders different types of objects that might appear
     * both as part of the blocks array, or as inline objects _inside_ of a block,
     * alongside text spans.
     *
     * Use the `isInline` property to check whether or not this is an inline object or a block
     *
     * The object has the shape `{typeName: VueComponent}`, where `typeName` is the value set
     * in individual `_type` attributes.
     */
    types: Record<string, PortableTextTypeComponent | undefined>;
    /**
     * Object of Vue components that renders different types of marks that might appear in spans.
     *
     * The object has the shape `{markName: VueComponent}`, where `markName` is the value set
     * in individual `_type` attributes, values being stored in the parent blocks `markDefs`.
     */
    marks: Record<string, PortableTextMarkComponent | undefined>;
    /**
     * Object of Vue components that renders blocks with different `style` properties.
     *
     * The object has the shape `{styleName: VueComponent}`, where `styleName` is the value set
     * in individual `style` attributes on blocks.
     *
     * Can also be set to a single Vue component, which would handle block styles of _any_ type.
     */
    block: Record<PortableTextBlockStyle, PortableTextBlockComponent | undefined> | PortableTextBlockComponent;
    /**
     * Object of Vue components used to render lists of different types (bulleted vs numbered,
     * for instance, which by default is `<ul>` and `<ol>`, respectively)
     *
     * There is no actual "list" node type in the Portable Text specification, but a series of
     * list item blocks with the same `level` and `listItem` properties will be grouped into a
     * virtual one inside of this library.
     *
     * Can also be set to a single Vue component, which would handle lists of _any_ type.
     */
    list: Record<PortableTextListItemType, PortableTextListComponent | undefined> | PortableTextListComponent;
    /**
     * Object of Vue components used to render different list item styles.
     *
     * The object has the shape `{listItemType: VueComponent}`, where `listItemType` is the value
     * set in individual `listItem` attributes on blocks.
     *
     * Can also be set to a single Vue component, which would handle list items of _any_ type.
     */
    listItem: Record<PortableTextListItemType, PortableTextListItemComponent | undefined> | PortableTextListItemComponent;
    /**
     * Component to use for rendering "hard breaks", eg `\n` inside of text spans
     * Will by default render a `<br />`. Pass `false` to render as-is (`\n`)
     */
    hardBreak: Component<{
        key: any;
    }> | false;
    /**
     * Vue component used when encountering a mark type there is no registered component for
     * in the `components.marks` prop.
     */
    unknownMark: PortableTextMarkComponent;
    /**
     * Vue component used when encountering an object type there is no registered component for
     * in the `components.types` prop.
     */
    unknownType: PortableTextComponent<UnknownNodeType>;
    /**
     * Vue component used when encountering a block style there is no registered component for
     * in the `components.block` prop. Only used if `components.block` is an object.
     */
    unknownBlockStyle: PortableTextComponent<PortableTextBlock>;
    /**
     * Vue component used when encountering a list style there is no registered component for
     * in the `components.list` prop. Only used if `components.list` is an object.
     */
    unknownList: PortableTextComponent<VuePortableTextList>;
    /**
     * Vue component used when encountering a list item style there is no registered component for
     * in the `components.listItem` prop. Only used if `components.listItem` is an object.
     */
    unknownListItem: PortableTextComponent<PortableTextListItemBlock>;
}

export declare interface Serializable<T> {
    node: T;
    index: number;
    isInline: boolean;
    renderNode: NodeRenderer;
}

export declare interface SerializedBlock {
    _key: string;
    children: VueNode;
    index: number;
    isInline: boolean;
    node: PortableTextBlock | PortableTextListItemBlock;
}

export { toPlainText }

/**
 * Any node type that we can't identify - eg it has an `_type`,
 * but we don't know anything about its other properties
 */
export declare type UnknownNodeType = {
    [key: string]: unknown;
    _type: string;
} | TypedObject;

export declare type VueNode = undefined | VNode | string | Array<undefined | VNode | string>;

/**
 * A virtual "list" node for Portable Text - not strictly part of Portable Text,
 * but generated by this library to ease the rendering of lists in HTML etc
 */
export declare type VuePortableTextList = ToolkitPortableTextList;

/**
 * A virtual "list item" node for Portable Text - not strictly any different from a
 * regular Portable Text Block, but we can guarantee that it has a `listItem` property.
 */
export declare type VuePortableTextListItem = ToolkitPortableTextListItem;

export { }
