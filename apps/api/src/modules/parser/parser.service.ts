import { Injectable } from "@nestjs/common";
import ts from "typescript";

export type RepositorySourceFile = {
  path: string;
  language: string;
  content: string;
  checksum: string;
  sizeBytes: number;
};

export type ParsedSymbol = {
  name: string;
  kind: string;
  lineStart: number;
  lineEnd: number;
  exported: boolean;
  metadata: Record<string, unknown>;
};

export type ParsedChunk = {
  chunkIndex: number;
  content: string;
  summary?: string;
  language: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
};

export type ParsedFile = RepositorySourceFile & {
  imports: string[];
  exports: string[];
  symbols: ParsedSymbol[];
  chunks: ParsedChunk[];
};

const SYMBOL_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.ModuleDeclaration,
  ts.SyntaxKind.VariableStatement
]);

function isTsJs(language: string) {
  return ["typescript", "tsx", "javascript", "jsx", "mjs", "cjs"].includes(language);
}

function scriptKindForPath(path: string) {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function lineRange(sourceFile: ts.SourceFile, node: ts.Node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    lineStart: start.line + 1,
    lineEnd: end.line + 1
  };
}

function hasExportModifier(node: ts.Node) {
  return Boolean(
    ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function getSymbolName(node: ts.Node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isModuleDeclaration(node)
  ) {
    return node.name?.getText() ?? null;
  }

  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations
      .map((declaration) => declaration.name.getText())
      .join(", ");
  }

  return null;
}

function getSymbolKind(node: ts.Node) {
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isModuleDeclaration(node)) return "module";
  if (ts.isVariableStatement(node)) return "variable";
  return "symbol";
}

function estimateTokens(content: string) {
  return Math.max(1, Math.ceil(content.length / 4));
}

function chunkLines(file: RepositorySourceFile, imports: string[], exports: string[]): ParsedChunk[] {
  const lines = file.content.split(/\r?\n/);
  const chunks: ParsedChunk[] = [];
  const windowSize = 80;

  for (let start = 0; start < lines.length; start += windowSize) {
    const selected = lines.slice(start, start + windowSize);
    const content = selected.join("\n").trim();
    if (!content) continue;

    chunks.push({
      chunkIndex: chunks.length,
      content,
      language: file.language,
      tokenCount: estimateTokens(content),
      metadata: {
        filePath: file.path,
        chunkType: "text",
        lineStart: start + 1,
        lineEnd: start + selected.length,
        imports,
        exports
      }
    });
  }

  return chunks;
}

@Injectable()
export class ParserService {
  parseFiles(files: RepositorySourceFile[]): ParsedFile[] {
    return files.map((file) => this.parseFile(file));
  }

  private parseFile(file: RepositorySourceFile): ParsedFile {
    if (!isTsJs(file.language)) {
      const chunks = chunkLines(file, [], []);
      return { ...file, imports: [], exports: [], symbols: [], chunks };
    }

    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      scriptKindForPath(file.path)
    );

    const imports: string[] = [];
    const exports: string[] = [];
    const symbols: ParsedSymbol[] = [];
    const chunks: ParsedChunk[] = [];

    sourceFile.forEachChild((node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/^["']|["']$/g, "");
        imports.push(moduleSpecifier);
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/^["']|["']$/g, "");
        exports.push(moduleSpecifier);
      }

      if (!SYMBOL_KINDS.has(node.kind)) {
        return;
      }

      const name = getSymbolName(node);
      if (!name) {
        return;
      }

      const exported = hasExportModifier(node);
      if (exported) {
        exports.push(name);
      }

      const range = lineRange(sourceFile, node);
      const content = node.getText(sourceFile);
      const kind = getSymbolKind(node);
      symbols.push({
        name,
        kind,
        exported,
        ...range,
        metadata: {
          filePath: file.path,
          imports,
          exports
        }
      });
      chunks.push({
        chunkIndex: chunks.length,
        content,
        summary: `${kind} ${name} in ${file.path}`,
        language: file.language,
        tokenCount: estimateTokens(content),
        metadata: {
          filePath: file.path,
          chunkType: "symbol",
          symbol: name,
          symbolKind: kind,
          ...range,
          imports,
          exports
        }
      });
    });

    const finalChunks = chunks.length ? chunks : chunkLines(file, imports, exports);
    return { ...file, imports, exports: Array.from(new Set(exports)), symbols, chunks: finalChunks };
  }
}
