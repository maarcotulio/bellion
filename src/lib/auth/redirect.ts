export function safeRedirectPath(value: FormDataEntryValue | string | string[] | undefined | null) {
  const path = Array.isArray(value) ? value[0] : value;

  if (typeof path !== "string") {
    return "/";
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
