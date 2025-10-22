import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// find all .ts files in src
const srcDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../src');

function getAllSourceFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getAllSourceFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const sourceFiles = getAllSourceFiles(srcDir);

const entrySourceFile = sourceFiles.find((f) => path.basename(f) === `index.ts`);

// create a TypeScript program from all .ts files
const tsProgram = ts.createProgram(sourceFiles, {
    allowJs: false,
    declaration: true,
    emitDeclarationOnly: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
});

const readmeTemplatePath = path.join(path.dirname(new URL(import.meta.url).pathname), './README.template.md');
const readmeOutPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../README.md');

let readmeText = fs.readFileSync(readmeTemplatePath, 'utf-8');

/* Shared anchor generation and collision tracking */
const usedAnchors = new Map(); // maps base anchor -> { type: 'module' | 'function' | 'type' }

function generateUniqueHeading(headingText, itemType = 'function') {
    const baseAnchor = headingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // collapse multiple hyphens

    if (usedAnchors.has(baseAnchor)) {
        // If this is a type and the anchor is already used, append (type)
        if (itemType === 'type') {
            if (headingText.startsWith('`') && headingText.endsWith('`')) {
                const inner = headingText.slice(1, -1);
                return `\`${inner}\` (type)`;
            }
            return `${headingText} (type)`;
        }
    }

    // Track this anchor
    usedAnchors.set(baseAnchor, { type: itemType });
    return headingText;
}

function generateAnchor(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // collapse multiple hyphens
}

/* <RenderAPI /> - render complete api docs */
function generateApiDocs() {
    let tocDocs = ''; // Table of contents with all module grids
    let detailDocs = ''; // Detailed documentation for each function

    const entryModules = [];

    /** @param {ts.Node} node */
    function visitEntrypointNode(node) {
        if (ts.isExportDeclaration(node)) {
            const name = node.exportClause?.name.escapedText;
            const module = node.moduleSpecifier.text;
            const modulePath = module.replace('./', '');
            const filePath = `${srcDir}/${modulePath}.ts`;
            const apiName = name ?? modulePath;

            entryModules.push({ name, module, modulePath, filePath, apiName });
        }
    }

    ts.forEachChild(tsProgram.getSourceFile(entrySourceFile), visitEntrypointNode);

    for (const entryModule of entryModules) {
        const file = sourceFiles.find((f) => f === entryModule.filePath);
        if (!file) {
            console.warn('couldnt find sourcefile for', entryModule.module);
            continue;
        }

        const sourceFile = tsProgram.getSourceFile(file);
        if (!sourceFile) {
            console.warn('couldnt get ts sourcefile for', file);
            continue;
        }

        const exported = [];
        function visit(node) {
            if (
                ts.isFunctionDeclaration(node) &&
                node.name &&
                node.modifiers &&
                node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
            ) {
                exported.push(node.name.text);
            }

            if (
                ts.isVariableStatement(node) &&
                node.modifiers &&
                node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
            ) {
                for (const decl of node.declarationList.declarations) {
                    if (decl.name && ts.isIdentifier(decl.name)) {
                        exported.push(decl.name.text);
                    }
                }
            }

            if (
                (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) &&
                node.name &&
                node.modifiers &&
                node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
            ) {
                exported.push(node.name.text);
            }

            ts.forEachChild(node, visit);
        }
        visit(sourceFile);

        // Generate unique module heading
        const moduleHeading = generateUniqueHeading(entryModule.apiName, 'module');

        // Pre-generate unique headings for all exported items
        const uniqueHeadings = new Map();
        for (const name of exported) {
            const prefix = entryModule.name ? `${entryModule.name}.` : '';
            const headingText = `\`${prefix}${name}\``;
            const uniqueHeading = generateUniqueHeading(headingText);
            uniqueHeadings.set(name, uniqueHeading);
        }

    // Add to TOC with module grid
    // Use bold module name instead of a Markdown heading so it doesn't
    // create an extra anchor that interferes with existing anchors.
    tocDocs += `**${entryModule.apiName}**\n\n`;

        if (exported.length > 0) {
            const maxCols = 4;
            // Determine columns based on longest display name to avoid cramped layouts.
            // Heuristics (tweak as needed):
            // - very long names -> 1 column
            // - long names -> 2 columns
            // - medium names -> 3 columns
            // - short names -> up to 4 columns
            const displayNames = exported.map((name) => (entryModule.name ? `${entryModule.name}.` : '') + name);
            const maxNameLen = displayNames.reduce((m, s) => Math.max(m, s.length), 0);

            // Choose number of columns (1..maxCols) by estimating how many columns of
            // width (maxNameLen + padding) fit in a reasonable target line width.
            // This avoids forcing a single column for names that are long but still
            // allow 2 columns to improve compactness (e.g. mat4).
            const targetLineWidth = 90; // approx characters per line for README render
            const perColWidth = Math.max(12, maxNameLen + 6); // include markup/padding
            let estimatedCols = Math.floor(targetLineWidth / perColWidth) || 1;
            estimatedCols = Math.min(maxCols, Math.max(1, estimatedCols));
            // But never exceed number of items; clamp to exported.length
            const itemsPerRow = Math.min(estimatedCols, exported.length);
            const links = [];

            for (const name of exported) {
                const prefix = entryModule.name ? `${entryModule.name}.` : '';
                const displayName = `${prefix}${name}`;
                const uniqueHeading = uniqueHeadings.get(name);
                const anchor = generateAnchor(uniqueHeading);
                links.push(`<a href="#${anchor}"><code>${displayName}</code></a>`);
            }

            // Build HTML table for TOC
            tocDocs += '<table><tr>\n';
            for (let i = 0; i < links.length; i++) {
                tocDocs += `<td>${links[i]}</td>`;
                if ((i + 1) % itemsPerRow === 0 && i < links.length - 1) {
                    tocDocs += '\n</tr><tr>\n';
                }
            }
            // Fill remaining cells if needed (only if we have more than 1 item)
            if (links.length > 1) {
                const remainder = links.length % itemsPerRow;
                if (remainder !== 0) {
                    for (let i = 0; i < itemsPerRow - remainder; i++) {
                        tocDocs += '<td></td>';
                    }
                }
            }
            tocDocs += '\n</tr></table>\n\n';
        }

        // Add detailed documentation
        detailDocs += `### ${moduleHeading}\n\n`;

        for (const name of exported) {
            const typeDoc = getType(name, sourceFile);

            if (typeDoc) {
                const lines = typeDoc.trim();
                const uniqueHeading = uniqueHeadings.get(name);
                detailDocs += `#### ${uniqueHeading}`;
                detailDocs += `\n\n\`\`\`ts\n`;
                detailDocs += lines;
                detailDocs += `\n\`\`\`\n\n`;
            }
        }
    }

    return tocDocs + '\n---\n\n## Reference\n\n' + detailDocs;
}

const renderApiRegex = /<RenderAPI\s*\/>/g;
readmeText = readmeText.replace(renderApiRegex, () => {
    const apiDocs = generateApiDocs();
    return apiDocs;
});

/* <RenderType type="import('mathcat').TypeName" /> */
const renderTypeRegex = /<RenderType\s+type=["']import\(['"]mathcat['"]\)\.(\w+)["']\s*\/>/g;
readmeText = readmeText.replace(renderTypeRegex, (fullMatch, typeName) => {
    const typeDef = getType(typeName);
    if (!typeDef) {
        console.warn(`Type ${typeName} not found`);
        return fullMatch;
    }
    return `\`\`\`ts\n${typeDef}\n\`\`\``;
});

/* <RenderSource type="import('mathcat').TypeName" /> */
const renderSourceRegex = /<RenderSource\s+type=["']import\(['"]mathcat['"]\)\.(\w+)["']\s*\/>/g;
readmeText = readmeText.replace(renderSourceRegex, (fullMatch, typeName) => {
    const typeDef = getSource(typeName);
    if (!typeDef) {
        console.warn(`Type ${typeName} not found`);
        return fullMatch;
    }
    return `\`\`\`ts\n${typeDef}\n\`\`\``;
});

/* <Snippet source="./snippets/file.ts" select="group" /> */
const snippetRegex = /<Snippet\s+source=["'](.+?)["']\s+select=["'](.+?)["']\s*\/>/g;
readmeText = readmeText.replace(snippetRegex, (fullMatch, sourcePath, groupName) => {
    const absSourcePath = path.join(path.dirname(new URL(import.meta.url).pathname), sourcePath);
    if (!fs.existsSync(absSourcePath)) {
        console.warn(`Snippet source file not found: ${absSourcePath}`);
        return fullMatch;
    }
    const sourceText = fs.readFileSync(absSourcePath, 'utf-8');

    // extract the selected group and its indentation
    const groupRegex = new RegExp(
        String.raw`^([ \t]*)\/\*[ \t]*SNIPPET_START:[ \t]*${groupName}[ \t]*\*\/[\r\n]+([\s\S]*?)[ \t]*^\1\/\*[ \t]*SNIPPET_END:[ \t]*${groupName}[ \t]*\*\/`,
        'm',
    );
    const match = groupRegex.exec(sourceText);
    if (!match) {
        console.warn(`Snippet group '${groupName}' not found in ${sourcePath}`);
        return fullMatch;
    }
    const baseIndent = match[1] || '';
    let snippetCode = match[2];
    // Remove the detected indentation from all lines
    if (baseIndent) {
        snippetCode = snippetCode.replace(new RegExp(`^${baseIndent}`, 'gm'), '');
    }
    // Remove any leading/trailing blank lines
    snippetCode = snippetCode.replace(/^\s*\n|\n\s*$/g, '');
    return `\`\`\`ts\n${snippetCode}\n\`\`\``;
});

/* write result */
fs.writeFileSync(readmeOutPath, readmeText, 'utf-8');

/* utils */
function getSource(typeName) {
    let found = null;
    function visit(node, fileText) {
        // Types, interfaces, classes
        if (
            (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) &&
            node.name &&
            node.name.text === typeName
        ) {
            found = fileText.slice(node.getFullStart(), node.getEnd());
        }
        // Exported function declarations
        if (
            ts.isFunctionDeclaration(node) &&
            node.name &&
            node.name.text === typeName &&
            node.modifiers &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            found = fileText.slice(node.getFullStart(), node.getEnd());
        }
        // Exported const expressions
        if (
            ts.isVariableStatement(node) &&
            node.modifiers &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            for (const decl of node.declarationList.declarations) {
                if (decl.name && ts.isIdentifier(decl.name) && decl.name.text === typeName) {
                    found = fileText.slice(node.getFullStart(), node.getEnd());
                }
            }
        }
        ts.forEachChild(node, (child) => visit(child, fileText));
    }

    // search all files for the type or function
    for (const file of sourceFiles) {
        const sf = tsProgram.getSourceFile(file);
        if (sf) {
            const fileText = sf.getFullText();
            visit(sf, fileText);
        }
        if (found) break;
    }

    return found ? found.trimStart() : null;
}

function getType(typeName, sourceFile = null) {
    const checker = tsProgram.getTypeChecker();

    let found = null;
    function visit(node, fileText) {
        // Types, interfaces, classes
        if (
            (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) &&
            node.name &&
            node.name.text === typeName
        ) {
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
            found = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
        }
        // Exported function declarations
        if (
            ts.isFunctionDeclaration(node) &&
            node.name &&
            node.name.text === typeName &&
            node.modifiers &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            // Get signature
            const sig = checker.getSignatureFromDeclaration(node);
            let sigStr = '';
            if (sig) {
                const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
                // Print the function signature as a declaration
                const sigNode = ts.factory.createFunctionDeclaration(
                    node.modifiers,
                    node.asteriskToken,
                    node.name,
                    node.typeParameters,
                    node.parameters,
                    node.type,
                    undefined, // no body
                );
                sigStr = printer.printNode(ts.EmitHint.Unspecified, sigNode, node.getSourceFile());
            }
            found = sigStr;
        }
        if (
            ts.isVariableStatement(node) &&
            node.modifiers &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            for (const decl of node.declarationList.declarations) {
                // Exported const function expressions (arrow or function)
                if (
                    decl.name &&
                    ts.isIdentifier(decl.name) &&
                    decl.name.text === typeName &&
                    decl.initializer &&
                    (ts.isFunctionExpression(decl.initializer) || ts.isArrowFunction(decl.initializer))
                ) {
                    // Get JSDoc (if any)
                    const jsDoc = ts
                        .getJSDocCommentsAndTags(node)
                        .map((doc) => fileText.slice(doc.pos, doc.end))
                        .join('');
                    // Print only the signature for getType
                    const func = decl.initializer;
                    const printer = ts.createPrinter({
                        newLine: ts.NewLineKind.LineFeed,
                    });
                    const sigNode = ts.factory.createFunctionDeclaration(
                        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                        undefined,
                        decl.name,
                        func.typeParameters,
                        func.parameters,
                        func.type,
                        undefined, // no body
                    );
                    const sigStr = printer.printNode(ts.EmitHint.Unspecified, sigNode, node.getSourceFile());
                    found = (jsDoc ? jsDoc + '\n' : '') + sigStr;
                } else if (decl.name && ts.isIdentifier(decl.name) && decl.name.text === typeName) {
                    // Get JSDoc (if any)
                    const jsDoc = ts
                        .getJSDocCommentsAndTags(node)
                        .map((doc) => fileText.slice(doc.pos, doc.end))
                        .join('');
                    // Print variable declaration
                    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
                    const varNode = ts.factory.createVariableStatement(
                        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                        ts.factory.createVariableDeclarationList(
                            [ts.factory.createVariableDeclaration(decl.name, undefined, decl.type, decl.initializer)],
                            node.declarationList.flags,
                        ),
                    );
                    const varStr = printer.printNode(ts.EmitHint.Unspecified, varNode, node.getSourceFile());
                    found = (jsDoc ? jsDoc + '\n' : '') + varStr;
                }
            }
        }
        ts.forEachChild(node, (child) => visit(child, fileText));
    }

    // If a specific source file is provided, only search that file
    // Otherwise, search all files for the type or function
    const filesToSearch = sourceFile ? [sourceFile] : sourceFiles.map(file => tsProgram.getSourceFile(file)).filter(Boolean);
    
    for (const sf of filesToSearch) {
        const fileText = sf.getFullText();
        visit(sf, fileText);
        if (found) break;
    }

    return found;
}
