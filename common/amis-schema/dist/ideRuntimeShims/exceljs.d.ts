declare class Worksheet {
    views: unknown[];
    columns: unknown[];
}
declare class Workbook {
    xlsx: {
        writeBuffer: () => Promise<ArrayBuffer>;
    };
    addWorksheet(): Worksheet;
}
declare const _default: {
    Workbook: typeof Workbook;
};
export default _default;
export { Workbook };
