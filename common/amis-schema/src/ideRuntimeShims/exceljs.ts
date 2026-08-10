class Worksheet {
  views: unknown[] = []
  columns: unknown[] = []
}

class Workbook {
  xlsx = {
    writeBuffer: async () => new ArrayBuffer(0),
  }

  addWorksheet() {
    return new Worksheet()
  }
}

export default { Workbook }
export { Workbook }
