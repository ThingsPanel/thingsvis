import { z } from "zod";
export declare const Transform3DSchema: z.ZodObject<{
    rx: z.ZodOptional<z.ZodNumber>;
    ry: z.ZodOptional<z.ZodNumber>;
    rz: z.ZodOptional<z.ZodNumber>;
    perspective: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    rx?: number | undefined;
    ry?: number | undefined;
    rz?: number | undefined;
    perspective?: number | undefined;
}, {
    rx?: number | undefined;
    ry?: number | undefined;
    rz?: number | undefined;
    perspective?: number | undefined;
}>;
export declare const NodeSchema: z.ZodObject<{
    id: z.ZodString;
    pluginId: z.ZodString;
    props: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    rotation: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    scaleX: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    scaleY: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    transform3D: z.ZodOptional<z.ZodObject<{
        rx: z.ZodOptional<z.ZodNumber>;
        ry: z.ZodOptional<z.ZodNumber>;
        rz: z.ZodOptional<z.ZodNumber>;
        perspective: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        rx?: number | undefined;
        ry?: number | undefined;
        rz?: number | undefined;
        perspective?: number | undefined;
    }, {
        rx?: number | undefined;
        ry?: number | undefined;
        rz?: number | undefined;
        perspective?: number | undefined;
    }>>;
    zIndex: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    groupId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    pluginId: string;
    props: Record<string, any>;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    zIndex: number;
    visible: boolean;
    transform3D?: {
        rx?: number | undefined;
        ry?: number | undefined;
        rz?: number | undefined;
        perspective?: number | undefined;
    } | undefined;
    groupId?: string | undefined;
}, {
    id: string;
    pluginId: string;
    x: number;
    y: number;
    props?: Record<string, any> | undefined;
    width?: number | undefined;
    height?: number | undefined;
    rotation?: number | undefined;
    scaleX?: number | undefined;
    scaleY?: number | undefined;
    transform3D?: {
        rx?: number | undefined;
        ry?: number | undefined;
        rz?: number | undefined;
        perspective?: number | undefined;
    } | undefined;
    zIndex?: number | undefined;
    visible?: boolean | undefined;
    groupId?: string | undefined;
}>;
export declare const SelectionStateSchema: z.ZodObject<{
    selectedIds: z.ZodArray<z.ZodString, "many">;
    primarySelectionId: z.ZodOptional<z.ZodString>;
    selectionBounds: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>>;
    transformHandle: z.ZodObject<{
        mode: z.ZodUnion<[z.ZodLiteral<"translate">, z.ZodLiteral<"scale">, z.ZodLiteral<"rotate">, z.ZodLiteral<"skew">]>;
    }, "strip", z.ZodTypeAny, {
        mode: "translate" | "scale" | "rotate" | "skew";
    }, {
        mode: "translate" | "scale" | "rotate" | "skew";
    }>;
}, "strip", z.ZodTypeAny, {
    selectedIds: string[];
    transformHandle: {
        mode: "translate" | "scale" | "rotate" | "skew";
    };
    primarySelectionId?: string | undefined;
    selectionBounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | undefined;
}, {
    selectedIds: string[];
    transformHandle: {
        mode: "translate" | "scale" | "rotate" | "skew";
    };
    primarySelectionId?: string | undefined;
    selectionBounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | undefined;
}>;
export declare const GroupSchema: z.ZodObject<{
    id: z.ZodString;
    memberIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    memberIds: string[];
}, {
    id: string;
    memberIds: string[];
}>;
export declare const ErrorBoundaryContextSchema: z.ZodObject<{
    pluginId: z.ZodString;
    nodeId: z.ZodString;
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        stack: z.ZodOptional<z.ZodString>;
        time: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        time: number;
        stack?: string | undefined;
    }, {
        message: string;
        time: number;
        stack?: string | undefined;
    }>>;
    fallbackUI: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    pluginId: string;
    nodeId: string;
    error?: {
        message: string;
        time: number;
        stack?: string | undefined;
    } | undefined;
    fallbackUI?: Record<string, any> | undefined;
}, {
    pluginId: string;
    nodeId: string;
    error?: {
        message: string;
        time: number;
        stack?: string | undefined;
    } | undefined;
    fallbackUI?: Record<string, any> | undefined;
}>;
export declare const PageSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    mode: z.ZodUnion<[z.ZodLiteral<"Fixed">, z.ZodLiteral<"Infinite">, z.ZodLiteral<"Reflow">]>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    layoutRules: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    nodes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pluginId: z.ZodString;
        props: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        height: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        rotation: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        scaleX: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        scaleY: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        transform3D: z.ZodOptional<z.ZodObject<{
            rx: z.ZodOptional<z.ZodNumber>;
            ry: z.ZodOptional<z.ZodNumber>;
            rz: z.ZodOptional<z.ZodNumber>;
            perspective: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        }, {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        }>>;
        zIndex: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        groupId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        pluginId: string;
        props: Record<string, any>;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        scaleX: number;
        scaleY: number;
        zIndex: number;
        visible: boolean;
        transform3D?: {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        } | undefined;
        groupId?: string | undefined;
    }, {
        id: string;
        pluginId: string;
        x: number;
        y: number;
        props?: Record<string, any> | undefined;
        width?: number | undefined;
        height?: number | undefined;
        rotation?: number | undefined;
        scaleX?: number | undefined;
        scaleY?: number | undefined;
        transform3D?: {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        } | undefined;
        zIndex?: number | undefined;
        visible?: boolean | undefined;
        groupId?: string | undefined;
    }>, "many">>>;
    meta: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    mode: "Fixed" | "Infinite" | "Reflow";
    nodes: {
        id: string;
        pluginId: string;
        props: Record<string, any>;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        scaleX: number;
        scaleY: number;
        zIndex: number;
        visible: boolean;
        transform3D?: {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        } | undefined;
        groupId?: string | undefined;
    }[];
    meta: Record<string, any>;
    width?: number | undefined;
    height?: number | undefined;
    title?: string | undefined;
    layoutRules?: Record<string, any> | undefined;
}, {
    id: string;
    mode: "Fixed" | "Infinite" | "Reflow";
    width?: number | undefined;
    height?: number | undefined;
    title?: string | undefined;
    layoutRules?: Record<string, any> | undefined;
    nodes?: {
        id: string;
        pluginId: string;
        x: number;
        y: number;
        props?: Record<string, any> | undefined;
        width?: number | undefined;
        height?: number | undefined;
        rotation?: number | undefined;
        scaleX?: number | undefined;
        scaleY?: number | undefined;
        transform3D?: {
            rx?: number | undefined;
            ry?: number | undefined;
            rz?: number | undefined;
            perspective?: number | undefined;
        } | undefined;
        zIndex?: number | undefined;
        visible?: boolean | undefined;
        groupId?: string | undefined;
    }[] | undefined;
    meta?: Record<string, any> | undefined;
}>;
export type Page = z.infer<typeof PageSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type SelectionState = z.infer<typeof SelectionStateSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type ErrorBoundaryContext = z.infer<typeof ErrorBoundaryContextSchema>;
//# sourceMappingURL=canvas-schema.d.ts.map