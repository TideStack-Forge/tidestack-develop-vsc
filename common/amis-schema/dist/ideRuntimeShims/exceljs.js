"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workbook = void 0;
class Worksheet {
    views = [];
    columns = [];
}
class Workbook {
    xlsx = {
        writeBuffer: async () => new ArrayBuffer(0),
    };
    addWorksheet() {
        return new Worksheet();
    }
}
exports.Workbook = Workbook;
exports.default = { Workbook };
