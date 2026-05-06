"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminDeleteRole, adminUpdateRolePermissions, adminUpsertRole, readStore } from "@/lib/store";
import type { AdminMenu, AdminRole, StoreShape } from "@/lib/types";

type RoleForm = {
  id?: string;
  name: string;
  code: string;
  description: string;
  status: AdminRole["status"];
};

const emptyForm: RoleForm = { name: "", code: "", description: "", status: "enabled" };

export default function AdminPermissionRolesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<RoleForm | null>(null);
  const [assigning, setAssigning] = useState<AdminRole | null>(null);
  const [checked, setChecked] = useState<string[]>([]);

  const roles = useMemo(() => {
    return store.admin_roles.filter((role) => {
      const matchKeyword = !keyword.trim() || role.name.includes(keyword.trim());
      const matchCode = !code.trim() || role.code.includes(code.trim());
      const matchDescription = !description.trim() || (role.description ?? "").includes(description.trim());
      return matchKeyword && matchCode && matchDescription;
    });
  }, [store.admin_roles, keyword, code, description]);

  const reload = () => setStore(readStore());

  const submitRole = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      adminUpsertRole(editing);
      setEditing(null);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  const openAssign = (role: AdminRole) => {
    setAssigning(role);
    setChecked(role.permissions);
  };

  const savePermissions = () => {
    if (!assigning) return;
    try {
      adminUpdateRolePermissions(assigning.id, checked);
      setAssigning(null);
      setChecked([]);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  const deleteRole = (role: AdminRole) => {
    if (!confirm(`确定删除角色「${role.name}」吗？`)) return;
    try {
      adminDeleteRole(role.id);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <AdminLayout title="角色管理">
      <AdminCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input className="admin-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入角色名称" />
          <input className="admin-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="请输入角色编码" />
          <input className="admin-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="请输入角色描述" />
          <button className="admin-button-secondary" onClick={() => { setKeyword(""); setCode(""); setDescription(""); }}>重置</button>
          <button className="admin-button" onClick={reload}>查询</button>
        </div>
      </AdminCard>

      <AdminCard className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="admin-button-secondary" onClick={() => setEditing(emptyForm)}>新增角色</button>
          <p className="text-xs font-bold text-slate-400">共 {roles.length} 条</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>角色 ID</th>
                <th>角色名称</th>
                <th>角色编码</th>
                <th>角色描述</th>
                <th>角色状态</th>
                <th>创建日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>{role.id}</td>
                  <td className="font-black text-slate-800">{role.name}</td>
                  <td>{role.code}</td>
                  <td>{role.description || "-"}</td>
                  <td><AdminBadge tone={role.status === "enabled" ? "green" : "slate"}>{role.status === "enabled" ? "启用" : "禁用"}</AdminBadge></td>
                  <td>{formatTime(role.createdAt)}</td>
                  <td>
                    <div className="flex gap-3">
                      <button className="admin-link" onClick={() => setEditing({ id: role.id, name: role.name, code: role.code, description: role.description ?? "", status: role.status })}>编辑</button>
                      <button className="admin-link text-amber-600" onClick={() => openAssign(role)}>分配权限</button>
                      <button className="admin-link text-rose-600" onClick={() => deleteRole(role)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!roles.length ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">暂无角色</td></tr> : null}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {editing ? (
        <div className="admin-modal-backdrop">
          <form onSubmit={submitRole} className="admin-modal w-full max-w-2xl">
            <div className="admin-modal-title">
              <h2>{editing.id ? "编辑角色" : "新增角色"}</h2>
              <button type="button" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="space-y-4 p-6">
              <Field label="角色名称" required><input className="admin-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="例如：运营管理员" /></Field>
              <Field label="角色编码" required><input className="admin-input" value={editing.code} onChange={(event) => setEditing({ ...editing, code: event.target.value })} placeholder="operations_admin" disabled={editing.code === "super_admin"} /></Field>
              <Field label="角色描述"><textarea className="admin-textarea h-24" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} placeholder="请输入角色描述" /></Field>
              <Field label="状态"><select className="admin-input" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as AdminRole["status"] })} disabled={editing.code === "super_admin"}><option value="enabled">启用</option><option value="disabled">禁用</option></select></Field>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-button-secondary" onClick={() => setEditing(null)}>取消</button>
              <button className="admin-button">提交</button>
            </div>
          </form>
        </div>
      ) : null}

      {assigning ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal w-full max-w-3xl">
            <div className="admin-modal-title">
              <h2>菜单权限 - {assigning.name}</h2>
              <button type="button" onClick={() => setAssigning(null)}>×</button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-6">
              <MenuTree menus={store.admin_menus} checked={checked} onToggle={(permission) => setChecked((prev) => prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission])} />
            </div>
            <div className="admin-modal-footer">
              <button className="admin-button-secondary" onClick={() => setChecked([])}>全部清空</button>
              <button className="admin-button-secondary" onClick={() => setChecked(allPermissions(store.admin_menus))}>全部选择</button>
              <button className="admin-button" onClick={savePermissions}>保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function MenuTree({ menus, checked, onToggle, parentId = null, depth = 0 }: { menus: AdminMenu[]; checked: string[]; onToggle: (permission: string) => void; parentId?: string | null; depth?: number }) {
  const rows = menus.filter((menu) => menu.parentId === parentId).sort((a, b) => b.sortOrder - a.sortOrder);
  return (
    <div className="space-y-2">
      {rows.map((menu) => {
        const children = menus.some((item) => item.parentId === menu.id);
        return (
          <div key={menu.id}>
            <label className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50" style={{ paddingLeft: 12 + depth * 24 }}>
              <span className="text-xs text-slate-400">{children ? "▾" : "·"}</span>
              <input type="checkbox" disabled={!menu.permissionKey} checked={!!menu.permissionKey && checked.includes(menu.permissionKey)} onChange={() => menu.permissionKey && onToggle(menu.permissionKey)} />
              <span className="text-sm font-bold text-slate-700">{menu.name}</span>
              {menu.permissionKey ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">{menu.permissionKey}</span> : null}
            </label>
            <MenuTree menus={menus} checked={checked} onToggle={onToggle} parentId={menu.id} depth={depth + 1} />
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-600 md:grid-cols-[120px_1fr] md:items-center"><span>{required ? <span className="text-rose-500">*</span> : null} {label}</span>{children}</label>;
}

function allPermissions(menus: AdminMenu[]) {
  return Array.from(new Set(menus.map((menu) => menu.permissionKey).filter(Boolean))) as string[];
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
