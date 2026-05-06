export interface PermissionBits {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ChmodPermissions {
  owner: PermissionBits;
  group: PermissionBits;
  other: PermissionBits;
}

export interface ChmodResult {
  octal: string;
  symbolic: string;
  command: string;
}

function permissionToDigit(permission: PermissionBits): string {
  const digit =
    (permission.read ? 4 : 0) + (permission.write ? 2 : 0) + (permission.execute ? 1 : 0);
  return String(digit);
}

function permissionToSymbolic(permission: PermissionBits): string {
  return `${permission.read ? "r" : "-"}${permission.write ? "w" : "-"}${permission.execute ? "x" : "-"}`;
}

export function buildChmodResult(permissions: ChmodPermissions): ChmodResult {
  const octal = [permissions.owner, permissions.group, permissions.other]
    .map(permissionToDigit)
    .join("");
  const symbolic = [permissions.owner, permissions.group, permissions.other]
    .map(permissionToSymbolic)
    .join("");

  return {
    octal,
    symbolic,
    command: `chmod ${octal} <path>`,
  };
}
