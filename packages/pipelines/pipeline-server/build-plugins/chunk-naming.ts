export const NODE_MODULES_RE = /node_modules[/\\][^.]/;

const virtualRe = /^(?:\0|#|virtual:)/;

function pathToPkgName(path: string): string | undefined {
  let pkgName = path.match(
    // eslint-disable-next-line e18e/prefer-static-regex
    /.*[/\\]node_modules[/\\](?<name>@[^/\\]+[/\\][^/\\]+|[^/\\.][^/\\]*)/,
  )?.groups?.name;
  if (pkgName?.endsWith("-nightly")) {
    pkgName = pkgName.slice(0, -8);
  }
  return pkgName;
}

export function libChunkName(id: string): string | undefined {
  const pkgName = pathToPkgName(id);
  return pkgName ? `_libs/${pkgName}` : undefined;
}

function joinPkgNames(moduleIds: string[]): string {
  const names = [
    ...new Set(
      moduleIds
        .map((id) => pathToPkgName(id))
        .filter(Boolean)
        // eslint-disable-next-line e18e/prefer-static-regex
        .map((name) => name!.replace(/^@/, "").replace(/[/\\]/g, "__")),
    ),
  ].toSorted();
  return names.join("+");
}

export function getChunkName(chunk: { name: string; moduleIds: string[] }): string {
  if (chunk.name === "rolldown-runtime") {
    return "_runtime.mjs";
  }

  if (chunk.moduleIds.every((id) => NODE_MODULES_RE.test(id))) {
    const chunkName = joinPkgNames(chunk.moduleIds);
    if (chunkName.length > 30) {
      return `${chunk.name}+[...].mjs`;
    }
    return `_libs/${chunkName || "_"}.mjs`;
  }

  if (chunk.name.startsWith("_")) {
    return `${chunk.name}.mjs`;
  }

  if (chunk.moduleIds.length === 0) {
    return `_chunks/${chunk.name}.mjs`;
  }

  const ids = chunk.moduleIds.filter((id) => !virtualRe.test(id));

  if (ids.length === 0) {
    if (chunk.moduleIds.every((id) => id.includes("virtual:raw"))) {
      return `_raw/[name].mjs`;
    }
    return `_virtual/[name].mjs`;
  }

  if (ids.every((id) => id.endsWith(".wasm"))) {
    return `_wasm/[name].mjs`;
  }

  return `_chunks/[name].mjs`;
}
