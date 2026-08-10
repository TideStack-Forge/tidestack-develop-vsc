var OuroborosMetadataEditorHostCore = (function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const types = /* @__PURE__ */ JSON.parse('[{"type":"authority","fileSuffix":".authority.json","displayName":"权限项模型","sourcePathPatterns":["src/main/metadata/**/*.authority.json"],"packagedPathPrefix":"META-INF/ouroboros/authority","editorKinds":["form","table"],"fileTemplate":{"defaultFileName":"example.authority.json","fields":[{"name":"fullName","label":"完整名称","documentPath":["fullName"],"required":true,"defaultFromPath":"camel-name"},{"name":"title","label":"标题","documentPath":["title"],"required":true,"defaultFromPath":"title"}],"document":{"fullName":"example.authority","title":"示例权限项","apis":[],"uiViews":[],"menuItems":[],"order":0}},"jsonSchema":{"type":"object","additionalProperties":true,"required":["fullName","title"],"properties":{"fullName":{"type":"string"},"title":{"type":"string"},"apis":{"type":"array","items":{"type":"string"}},"uiViews":{"type":"array","items":{"type":"string"}},"menuItems":{"type":"array","items":{"type":"string"}},"order":{"type":"integer"}}},"editorSchema":{"type":"form","title":"权限项模型","actions":[],"body":[{"type":"input-text","name":"fullName","label":"完整名称","required":true},{"type":"input-text","name":"title","label":"标题","required":true},{"type":"input-number","name":"order","label":"排序"},{"type":"input-array","name":"apis","label":"关联接口","items":{"type":"input-text","name":"api","label":"接口"}},{"type":"input-array","name":"uiViews","label":"关联界面","items":{"type":"input-text","name":"uiView","label":"界面"}},{"type":"input-array","name":"menuItems","label":"关联菜单","items":{"type":"input-text","name":"menuItem","label":"菜单项"}}]}},{"type":"menu","fileSuffix":".menu.json","displayName":"菜单模型","sourcePathPatterns":["src/main/metadata/**/*.menu.json"],"packagedPathPrefix":"META-INF/ouroboros/menu-model","editorKinds":["form"],"fileTemplate":{"defaultFileName":"example.menu.json","fields":[{"name":"fullName","label":"完整名称","documentPath":["fullName"],"required":true,"defaultFromPath":"camel-name"},{"name":"title","label":"标题","documentPath":["title"],"required":true,"defaultFromPath":"title"},{"name":"url","label":"访问路径","documentPath":["url"],"defaultFromPath":"slash-path"}],"document":{"fullName":"example.menu","title":"示例菜单","url":"/example","icon":"fa fa-circle","placement":"main","showMode":"tab","order":0}},"jsonSchema":{"type":"object","additionalProperties":true,"required":["fullName","title"],"properties":{"fullName":{"type":"string"},"title":{"type":"string"},"url":{"type":"string"},"icon":{"type":"string"},"placement":{"type":"string","enum":["main","secondary","all"]},"showMode":{"type":"string","enum":["tab","fullScreen","newWindow"]},"order":{"type":"integer"}}},"editorSchema":{"type":"form","title":"菜单模型","actions":[],"body":[{"type":"input-text","name":"fullName","label":"完整名称","required":true},{"type":"input-text","name":"title","label":"标题","required":true},{"type":"input-text","name":"url","label":"访问路径"},{"type":"input-text","name":"icon","label":"图标"},{"type":"select","name":"placement","label":"位置","options":[{"label":"主区域","value":"main"},{"label":"次级区域","value":"secondary"},{"label":"全部","value":"all"}]},{"type":"select","name":"showMode","label":"显示方式","options":[{"label":"标签页","value":"tab"},{"label":"全屏","value":"fullScreen"},{"label":"新窗口","value":"newWindow"}]},{"type":"input-number","name":"order","label":"排序"}]}},{"type":"dev-menu","fileSuffix":".dev-menu.json","displayName":"开发菜单模型","sourcePathPatterns":["src/main/metadata/**/*.dev-menu.json"],"packagedPathPrefix":"META-INF/ouroboros/dev-menu-model","editorKinds":["form"],"fileTemplate":{"defaultFileName":"example.dev-menu.json","fields":[{"name":"fullName","label":"完整名称","documentPath":["fullName"],"required":true,"defaultFromPath":"dot-name"},{"name":"title","label":"标题","documentPath":["title"],"required":true,"defaultFromPath":"title"},{"name":"url","label":"访问路径","documentPath":["url"],"defaultFromPath":"slash-path"}],"document":{"fullName":"AllModels.Example","title":"示例开发菜单","url":"/dev/{appName}/example","icon":"fa fa-circle","placement":"main","stage":"dev","showMode":"tab","order":0}},"jsonSchema":{"type":"object","additionalProperties":true,"required":["fullName","title"],"properties":{"fullName":{"type":"string"},"title":{"type":"string"},"url":{"type":"string"},"icon":{"type":"string"},"placement":{"type":"string","enum":["main","secondary","all"]},"stage":{"type":"string","enum":["welcome","dev","all"]},"showMode":{"type":"string","enum":["tab","fullScreen","newWindow"]},"order":{"type":"integer"},"children":{"type":"array","items":{"type":"object","additionalProperties":true,"required":["fullName","title"],"properties":{"fullName":{"type":"string"},"title":{"type":"string"},"url":{"type":"string"},"placement":{"type":"string","enum":["main","secondary","all"]},"stage":{"type":"string","enum":["welcome","dev","all"]},"order":{"type":"integer"}}}}}},"editorSchema":{"type":"form","title":"开发菜单模型","actions":[],"body":[{"type":"input-text","name":"fullName","label":"完整名称","required":true},{"type":"input-text","name":"title","label":"标题","required":true},{"type":"input-text","name":"url","label":"访问路径"},{"type":"input-text","name":"icon","label":"图标"},{"type":"select","name":"placement","label":"位置","options":[{"label":"主区域","value":"main"},{"label":"次级区域","value":"secondary"},{"label":"全部","value":"all"}]},{"type":"select","name":"stage","label":"阶段","options":[{"label":"欢迎页","value":"welcome"},{"label":"开发","value":"dev"},{"label":"全部","value":"all"}]},{"type":"select","name":"showMode","label":"显示方式","options":[{"label":"标签页","value":"tab"},{"label":"全屏","value":"fullScreen"},{"label":"新窗口","value":"newWindow"}]},{"type":"input-number","name":"order","label":"排序"}]}},{"type":"ui-model","fileSuffix":".ui-model.json","displayName":"UI 模型","sourcePathPatterns":["src/main/metadata/**/*.ui-model.json"],"packagedPathPrefix":"META-INF/ouroboros/ui-model","editorKinds":["form"],"fileTemplate":{"defaultFileName":"example.ui-model.json","fields":[{"name":"path","label":"UI 路径","documentPath":["path"],"required":true,"defaultFromPath":"slash-path"},{"name":"title","label":"标题","documentPath":["title"],"required":true,"defaultFromPath":"title"},{"name":"description","label":"描述","documentPath":["description"]}],"document":{"path":"/example","type":"amis","title":"示例页面","icon":"fa fa-file","description":"示例 UI 模型"}},"jsonSchema":{"type":"object","additionalProperties":true,"required":["path","type","title"],"properties":{"path":{"type":"string"},"type":{"type":"string"},"title":{"type":"string"},"icon":{"type":"string"},"description":{"type":"string"}}},"editorSchema":{"type":"form","title":"UI 模型","actions":[],"body":[{"type":"input-text","name":"path","label":"UI 路径","required":true},{"type":"input-text","name":"type","label":"渲染类型","required":true},{"type":"input-text","name":"title","label":"中文标题","required":true},{"type":"input-text","name":"icon","label":"图标"},{"type":"textarea","name":"description","label":"描述","minRows":3}]}},{"type":"ui-schema","fileSuffix":".ui-schema.json","displayName":"UI Schema","sourcePathPatterns":["src/main/metadata/**/*.ui-schema.json"],"packagedPathPrefix":"META-INF/ouroboros/ui-schema","editorKind":"amis-editor","editorKinds":["amis-editor"],"fileTemplate":{"defaultFileName":"example.ui-schema.json","fields":[{"name":"name","label":"名称","labelRemark":"按低代码页面命名习惯填写点分名称，例如 Admin.UserList；系统运行时会映射成 /admin/user-list。","documentPath":["name"],"required":true,"defaultFromPath":"dot-name"},{"name":"title","label":"标题","documentPath":["title"],"required":true,"defaultFromPath":"title"},{"name":"description","label":"描述","documentPath":["description"]}],"document":{"name":"Example","title":"示例页面","description":"示例 UI Schema","schema":{"type":"page","body":[]}}},"jsonSchema":{"type":"object","additionalProperties":true,"properties":{"name":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"},"schema":{"type":"object"},"type":{"type":"string"},"id":{"type":"string"},"className":{"type":"string"},"visible":{"type":"boolean"},"hidden":{"type":"boolean"},"visibleOn":{"type":"string"},"hiddenOn":{"type":"string"}}},"editorSchema":{"type":"form","title":"UI Schema","actions":[],"body":[{"type":"input-text","name":"type","label":"组件类型","required":true},{"type":"input-text","name":"name","label":"字段名称"},{"type":"input-text","name":"id","label":"组件 ID"},{"type":"input-text","name":"title","label":"中文标题"},{"type":"input-text","name":"className","label":"样式类名"},{"type":"switch","name":"visible","label":"可见"},{"type":"switch","name":"hidden","label":"隐藏"},{"type":"input-text","name":"visibleOn","label":"显示条件"},{"type":"input-text","name":"hiddenOn","label":"隐藏条件"},{"type":"json-editor","name":"body","label":"主体内容","allowClear":true},{"type":"json-editor","name":"actions","label":"动作配置","allowClear":true},{"type":"json-editor","name":"data","label":"数据配置","allowClear":true},{"type":"json-editor","name":"api","label":"提交接口","allowClear":true},{"type":"json-editor","name":"initApi","label":"初始化接口","allowClear":true},{"type":"json-editor","name":"onEvent","label":"事件配置","allowClear":true}]}},{"type":"app-module","fixedFileName":"app-modules.json","displayName":"应用模块","sourcePathPatterns":["src/main/metadata/app-modules.json"],"packagedPathPrefix":"META-INF/ouroboros/app-module","packagedPathPatterns":["app-modules.json"],"documentShape":"array","editorKinds":["form","table"],"fileTemplate":{"defaultFileName":"app-modules.json","fields":[{"name":"fullName","label":"模块全名","documentPath":["0","fullName"],"required":true},{"name":"title","label":"标题","documentPath":["0","title"],"required":true},{"name":"description","label":"描述","documentPath":["0","description"]}],"document":[{"fullName":"example","title":"示例应用模块","description":"示例应用模块","icon":"fa fa-cube","order":0,"menu":"example.menu","subMenus":[],"authorities":[]}]},"jsonSchema":{"type":"array","items":{"type":"object","additionalProperties":true,"required":["fullName","title"],"properties":{"fullName":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"},"icon":{"type":"string"},"order":{"type":"integer"},"menu":{"type":"string"},"subMenus":{"type":"array","items":{"type":"string"}},"authorities":{"type":"array","items":{"type":"string"}}}}},"editorSchema":{"type":"form","title":"应用模块","documentShape":"array","actions":[],"body":[{"type":"combo","name":"items","label":"应用模块列表","multiple":true,"multiLine":true,"draggable":true,"addButtonText":"新增应用模块","items":[{"type":"input-text","name":"fullName","label":"模块全名","required":true},{"type":"input-text","name":"title","label":"中文标题","required":true},{"type":"textarea","name":"description","label":"描述","minRows":2},{"type":"input-text","name":"icon","label":"图标"},{"type":"input-number","name":"order","label":"排序"},{"type":"input-text","name":"menu","label":"关联菜单"},{"type":"input-array","name":"subMenus","label":"子菜单","items":[{"type":"input-text","placeholder":"菜单全名"}]},{"type":"input-array","name":"authorities","label":"权限项","items":[{"type":"input-text","placeholder":"权限全名"}]}]}]}},{"type":"configuration","fixedFileName":"configuration.json","displayName":"配置项","sourcePathPatterns":["src/main/metadata/configuration.json"],"packagedPathPrefix":"META-INF/ouroboros/configuration","packagedPathPatterns":["configuration.json"],"documentShape":"array","editorKinds":["form","table"],"fileTemplate":{"defaultFileName":"configuration.json","fields":[{"name":"key","label":"配置键","documentPath":["0","key"],"required":true},{"name":"label","label":"标签","documentPath":["0","label"],"required":true},{"name":"description","label":"描述","documentPath":["0","description"]}],"document":[{"key":"example.enabled","label":"启用示例功能","description":"示例配置项","modifiable":true,"nullable":false,"valueType":"boolean","defaultValue":"false","groupPath":"example","order":0,"scope":"backend"}]},"jsonSchema":{"type":"array","items":{"type":"object","additionalProperties":true,"required":["key","label","valueType"],"properties":{"key":{"type":"string"},"label":{"type":"string"},"description":{"type":"string"},"modifiable":{"type":"boolean"},"nullable":{"type":"boolean"},"valueType":{"type":"string","enum":["int","long","float","double","boolean","string","object","map","list","array"]},"defaultValue":{"type":"string"},"groupPath":{"type":"string"},"order":{"type":"integer"},"scope":{"type":"string","enum":["frontend","backend"]},"obsolete":{"type":"boolean"},"obsoleteCause":{"type":"string"},"editorSchema":{"type":"object"}}}},"editorSchema":{"type":"form","title":"配置项","documentShape":"array","actions":[],"body":[{"type":"combo","name":"items","label":"配置项列表","multiple":true,"multiLine":true,"draggable":true,"addButtonText":"新增配置项","items":[{"type":"input-text","name":"key","label":"配置键","required":true},{"type":"input-text","name":"label","label":"中文标签","required":true},{"type":"textarea","name":"description","label":"描述","minRows":2},{"type":"switch","name":"modifiable","label":"允许修改"},{"type":"switch","name":"nullable","label":"允许为空"},{"type":"select","name":"valueType","label":"值类型","required":true,"options":[{"label":"整数","value":"int"},{"label":"长整数","value":"long"},{"label":"单精度小数","value":"float"},{"label":"双精度小数","value":"double"},{"label":"布尔","value":"boolean"},{"label":"字符串","value":"string"},{"label":"对象","value":"object"},{"label":"映射","value":"map"},{"label":"列表","value":"list"},{"label":"数组","value":"array"}]},{"type":"input-text","name":"defaultValue","label":"默认值"},{"type":"input-text","name":"groupPath","label":"配置分组路径"},{"type":"input-number","name":"order","label":"排序"},{"type":"select","name":"scope","label":"作用范围","options":[{"label":"后端","value":"backend"},{"label":"前端","value":"frontend"}]},{"type":"switch","name":"obsolete","label":"已废弃"},{"type":"input-text","name":"obsoleteCause","label":"废弃原因"},{"type":"json-editor","name":"editorSchema","label":"编辑器 Schema","allowClear":true}]}]}},{"type":"configuration-group","fixedFileName":"configuration-groups.json","displayName":"配置分组","sourcePathPatterns":["src/main/metadata/configuration-groups.json"],"packagedPathPrefix":"META-INF/ouroboros/configuration-group","packagedPathPatterns":["configuration-groups.json"],"documentShape":"array","editorKinds":["form","table"],"fileTemplate":{"defaultFileName":"configuration-groups.json","fields":[{"name":"path","label":"分组路径","documentPath":["0","path"],"required":true},{"name":"title","label":"标题","documentPath":["0","title"],"required":true},{"name":"description","label":"描述","documentPath":["0","description"]}],"document":[{"path":"example","title":"示例配置分组","icon":"fa fa-folder","order":0,"description":"示例配置分组"}]},"jsonSchema":{"type":"array","items":{"type":"object","additionalProperties":true,"required":["path","title"],"properties":{"path":{"type":"string"},"title":{"type":"string"},"icon":{"type":"string"},"order":{"type":"integer"},"description":{"type":"string"}}}},"editorSchema":{"type":"form","title":"配置分组","documentShape":"array","actions":[],"body":[{"type":"combo","name":"items","label":"配置分组列表","multiple":true,"multiLine":true,"draggable":true,"addButtonText":"新增配置分组","items":[{"type":"input-text","name":"path","label":"分组路径","required":true},{"type":"input-text","name":"title","label":"中文标题","required":true},{"type":"input-text","name":"icon","label":"图标"},{"type":"input-number","name":"order","label":"排序"},{"type":"textarea","name":"description","label":"描述","minRows":2}]}]}}]');
  const contributionManifest = {
    types
  };
  const SOURCE_ROOT = "src/main/metadata/";
  const PACKAGED_RESOURCE_ROOT = "resources/META-INF/ouroboros/";
  const METADATA_RESOURCE_DIRECTORY = "metadata/";
  const FIXED_METADATA_FILE_TYPES = {
    "app-modules.json": "app-module",
    "configuration.json": "configuration",
    "configuration-groups.json": "configuration-group"
  };
  const FIXED_METADATA_TYPES = new Set(Object.values(FIXED_METADATA_FILE_TYPES));
  const contributionDefinitions = contributionManifest.types;
  const metadataTypeContributions = contributionDefinitions.map((definition) => ({
    type: definition.type,
    fileSuffix: definition.fileSuffix,
    fixedFileName: definition.fixedFileName,
    displayName: definition.displayName,
    sourcePathPatterns: [...definition.sourcePathPatterns],
    packagedPathPrefix: definition.packagedPathPrefix,
    packagedPathPatterns: [...definition.packagedPathPatterns ?? []],
    editorKind: definition.editorKind ?? definition.editorKinds[0] ?? "form",
    editorKinds: [...definition.editorKinds],
    documentShape: definition.documentShape ?? "object",
    jsonSchema: cloneObject(definition.jsonSchema),
    fileTemplate: definition.fileTemplate ? cloneValue(definition.fileTemplate) : void 0,
    createEditorSchema: () => cloneObject(definition.editorSchema),
    normalize: normalizeObject
  }));
  function getContributionByType(type) {
    return metadataTypeContributions.find((contribution) => contribution.type === type);
  }
  function getContributionBySuffix(uri) {
    const contribution = getRawContributionBySuffix(uri);
    return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : void 0;
  }
  function getContributionByPackagedPath(uri) {
    const relativePath = getPackagedResourceRelativePath(uri);
    if (!relativePath) {
      return void 0;
    }
    if (relativePath.startsWith(METADATA_RESOURCE_DIRECTORY)) {
      return getContributionByMetadataRelativePath(relativePath.slice(METADATA_RESOURCE_DIRECTORY.length));
    }
    return metadataTypeContributions.find((contribution) => {
      var _a;
      const runtimeDirectory = contribution.packagedPathPrefix.replace("META-INF/ouroboros/", "");
      return ((_a = contribution.packagedPathPatterns) == null ? void 0 : _a.includes(relativePath)) === true || relativePath.startsWith(`${runtimeDirectory}/`);
    });
  }
  function mapMetadataSourcePath(uri) {
    const normalizedPath = normalizePath(uri);
    const sourceRootIndex = normalizedPath.lastIndexOf(SOURCE_ROOT);
    const sourceRelativePath = sourceRootIndex >= 0 ? normalizedPath.slice(sourceRootIndex + SOURCE_ROOT.length) : void 0;
    const contribution = sourceRelativePath ? getContributionByMetadataRelativePath(sourceRelativePath) : getContributionBySuffix(normalizedPath);
    if (!contribution) {
      return void 0;
    }
    const relativePath = sourceRelativePath ?? normalizedPath.slice(normalizedPath.lastIndexOf("/") + 1);
    const diagnostics = [];
    return {
      type: contribution.type,
      sourcePath: normalizedPath,
      packagedPath: `META-INF/ouroboros/metadata/${relativePath}`,
      contribution,
      diagnostics
    };
  }
  function mapMetadataPackagedResourcePath(uri) {
    const normalizedPath = normalizePath(uri);
    const relativePath = getPackagedResourceRelativePath(normalizedPath);
    if (!relativePath || !relativePath.endsWith(".json")) {
      return void 0;
    }
    const contribution = getContributionByPackagedPath(normalizedPath);
    if (!contribution) {
      return void 0;
    }
    const suffixContribution = getRawContributionBySuffix(normalizedPath);
    const diagnostics = [];
    if (suffixContribution && suffixContribution.type !== contribution.type) {
      diagnostics.push({
        code: "metadata-path-suffix-conflict",
        message: `Packaged path ${contribution.packagedPathPrefix} resolves this file as ${contribution.type}, but suffix ${suffixContribution.fileSuffix} resolves it as ${suffixContribution.type}.`,
        severity: "error",
        path: normalizedPath
      });
    }
    return {
      type: contribution.type,
      sourcePath: normalizedPath,
      packagedPath: `META-INF/ouroboros/${relativePath}`,
      contribution,
      diagnostics
    };
  }
  function normalizePath(path) {
    return path.replace(/\\/g, "/");
  }
  function getPackagedResourceRelativePath(path) {
    const normalizedPath = normalizePath(path);
    const resourceRootIndex = normalizedPath.lastIndexOf(PACKAGED_RESOURCE_ROOT);
    if (resourceRootIndex < 0) {
      return void 0;
    }
    return normalizedPath.slice(resourceRootIndex + PACKAGED_RESOURCE_ROOT.length);
  }
  function getContributionByMetadataRelativePath(relativePath) {
    const normalizedPath = normalizePath(relativePath);
    const fixedType = FIXED_METADATA_FILE_TYPES[normalizedPath];
    if (fixedType) {
      return getContributionByType(fixedType);
    }
    const contribution = getContributionBySuffix(normalizedPath);
    return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : void 0;
  }
  function getRawContributionBySuffix(uri) {
    return metadataTypeContributions.find((contribution) => contribution.fileSuffix && uri.endsWith(contribution.fileSuffix));
  }
  function normalizeObject(document) {
    if (Array.isArray(document)) {
      return document.map((item) => normalizeObject(item));
    }
    if (!document || typeof document !== "object") {
      return document;
    }
    return Object.fromEntries(
      Object.entries(document).map(([key, value]) => [key, normalizeObject(value)])
    );
  }
  function cloneObject(value) {
    return cloneValue(value);
  }
  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function parseMetadataJson(text) {
    try {
      return { value: JSON.parse(text), diagnostics: [] };
    } catch (error) {
      return {
        diagnostics: [
          {
            code: "invalid-json",
            message: error instanceof Error ? error.message : "Invalid JSON document.",
            severity: "error"
          }
        ]
      };
    }
  }
  class MetadataRevisionConflictError extends Error {
    constructor(message) {
      super(message);
      __publicField(this, "code", "revision-conflict");
      this.name = "MetadataRevisionConflictError";
    }
  }
  function createMetadataEditorHost(fileBridge) {
    function resolveDocumentType(uri) {
      const mapping = mapMetadataPackagedResourcePath(uri) ?? mapMetadataSourcePath(uri);
      if (mapping) {
        return {
          type: mapping.type,
          packagedPath: mapping.packagedPath,
          contribution: mapping.contribution,
          diagnostics: mapping.diagnostics
        };
      }
      const contribution = getContributionBySuffix(uri);
      if (!contribution) {
        return { diagnostics: [] };
      }
      return {
        type: contribution.type,
        contribution,
        diagnostics: []
      };
    }
    async function validateDocument(uri, text) {
      const documentType = resolveDocumentType(uri);
      const parsed = parseMetadataJson(text);
      const diagnostics = [...documentType.diagnostics, ...parsed.diagnostics];
      if (parsed.value !== void 0 && documentType.contribution) {
        diagnostics.push(...validateJsonSchema(parsed.value, documentType.contribution.jsonSchema));
        if (documentType.contribution.validateSemantics) {
          diagnostics.push(
            ...documentType.contribution.validateSemantics(parsed.value, {
              uri,
              packagedPath: documentType.packagedPath
            })
          );
        }
      }
      await fileBridge.publishDiagnostics(uri, diagnostics);
      return diagnostics;
    }
    async function toEditorDocument(uri, text, revision) {
      const documentType = resolveDocumentType(uri);
      const parsed = parseMetadataJson(text);
      const diagnostics = await validateDocument(uri, text);
      return {
        uri,
        text,
        revision,
        type: documentType.type,
        packagedPath: documentType.packagedPath,
        diagnostics,
        value: parsed.value
      };
    }
    return {
      async getRuntimeConfig() {
        return { supportedTypes: metadataTypeContributions.map((contribution) => contribution.type) };
      },
      async getTypeContribution(typeOrUri) {
        const contribution = getContributionByType(typeOrUri) ?? getContributionByPackagedPath(typeOrUri) ?? getContributionBySuffix(typeOrUri);
        if (!contribution) {
          throw new Error(`Unsupported metadata type or URI: ${typeOrUri}`);
        }
        return contribution;
      },
      async loadDocument(uri) {
        const file = await fileBridge.loadText(uri);
        return toEditorDocument(uri, file.text, file.revision);
      },
      async applyChange(uri, nextText, baseRevision) {
        const saved = await fileBridge.saveText(uri, nextText, baseRevision);
        return toEditorDocument(uri, nextText, saved.revision);
      },
      validateDocument,
      async openReference(target) {
        if (!fileBridge.openReference) {
          throw new Error("The metadata editor host does not support opening references");
        }
        await fileBridge.openReference(target);
      }
    };
  }
  function validateJsonSchema(document, schema) {
    return validateAgainstSchema(document, schema, "");
  }
  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function validateAgainstSchema(value, schema, path) {
    const enumValues = Array.isArray(schema.enum) ? schema.enum : void 0;
    if (enumValues && !enumValues.includes(value)) {
      return [enumDiagnostic(path, enumValues)];
    }
    if (schema.type === "object") {
      if (!isRecord(value)) {
        return [typeDiagnostic(path, "object")];
      }
      const diagnostics = [];
      const required = Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === "string") : [];
      const properties = isRecord(schema.properties) ? schema.properties : {};
      for (const name of required) {
        const nextPath = joinPath(path, name);
        if (!(name in value)) {
          diagnostics.push({
            code: "schema-required-property",
            message: `Metadata document is missing required property '${nextPath}'.`,
            severity: "error",
            path: nextPath
          });
        }
      }
      for (const [name, propertySchema] of Object.entries(properties)) {
        if (name in value && isRecord(propertySchema)) {
          diagnostics.push(...validateAgainstSchema(value[name], propertySchema, joinPath(path, name)));
        }
      }
      return diagnostics;
    }
    if (schema.type === "array") {
      if (!Array.isArray(value)) {
        return [typeDiagnostic(path, "array")];
      }
      const itemSchema = isRecord(schema.items) ? schema.items : void 0;
      return itemSchema ? value.flatMap((item, index) => validateAgainstSchema(item, itemSchema, `${path}[${index}]`)) : [];
    }
    if (schema.type === "string" && typeof value !== "string") {
      return [typeDiagnostic(path, "string")];
    }
    if (schema.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
      return [typeDiagnostic(path, "number")];
    }
    if (schema.type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) {
      return [typeDiagnostic(path, "integer")];
    }
    if (schema.type === "boolean" && typeof value !== "boolean") {
      return [typeDiagnostic(path, "boolean")];
    }
    return [];
  }
  function typeDiagnostic(path, expectedType) {
    return {
      code: "schema-property-type",
      message: path ? `Metadata property '${path}' must be a ${expectedType}.` : `Metadata document must be a ${expectedType}.`,
      severity: "error",
      path: path || void 0
    };
  }
  function enumDiagnostic(path, enumValues) {
    return {
      code: "schema-enum-value",
      message: `Metadata property '${path}' must be one of: ${enumValues.join(", ")}.`,
      severity: "error",
      path: path || void 0
    };
  }
  function joinPath(prefix, name) {
    return prefix ? `${prefix}.${name}` : name;
  }
  async function createMetadataEditorState(host, uri, expectedType) {
    return createMetadataEditorStateFromDocument(host, uri, expectedType, await host.loadDocument(uri));
  }
  async function createMetadataEditorStateFromDocument(host, uri, expectedType, document) {
    if (document.type !== expectedType) {
      return {
        document: {
          ...document,
          diagnostics: [
            ...document.diagnostics,
            {
              code: "metadata-editor-type-mismatch",
              message: `This editor handles ${expectedType} metadata, but the file resolved as ${document.type ?? "unsupported"} metadata.`,
              severity: "error"
            }
          ]
        }
      };
    }
    const contribution = await host.getTypeContribution(expectedType);
    return {
      document,
      editorKind: contribution.editorKind,
      editorSchema: contribution.createEditorSchema({ uri, document: document.value }),
      documentShape: contribution.documentShape
    };
  }
  function createBrowserMetadataEditorHost(options) {
    let currentDocument = { ...options.initialDocument };
    const bridge = {
      async loadText() {
        return { ...currentDocument };
      },
      async saveText(_uri, text, baseRevision) {
        const saved = await options.saveText(text, baseRevision);
        if (currentDocument.revision !== baseRevision) {
          if (currentDocument.revision === saved.revision && currentDocument.text === text) {
            return saved;
          }
          throw new MetadataRevisionConflictError(
            `Metadata document changed while saving: expected ${baseRevision}, current ${currentDocument.revision}`
          );
        }
        currentDocument = { text, revision: saved.revision };
        return saved;
      },
      async publishDiagnostics(_uri, diagnostics) {
        var _a;
        await ((_a = options.publishDiagnostics) == null ? void 0 : _a.call(options, diagnostics));
      }
    };
    const host = createMetadataEditorHost(bridge);
    return {
      async loadState() {
        return createMetadataEditorState(host, options.uri, options.metadataType);
      },
      async saveText(text, baseRevision) {
        const document = await host.applyChange(options.uri, text, baseRevision);
        return createMetadataEditorStateFromDocument(host, options.uri, options.metadataType, document);
      },
      async validate(text) {
        return host.validateDocument(options.uri, text);
      },
      async applyExternalDocument(document) {
        currentDocument = { ...document };
        return createMetadataEditorState(host, options.uri, options.metadataType);
      }
    };
  }
  exports.createBrowserMetadataEditorHost = createBrowserMetadataEditorHost;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
})({});
