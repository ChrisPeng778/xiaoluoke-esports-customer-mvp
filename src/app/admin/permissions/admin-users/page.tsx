"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminDeleteAdminUser, adminToggleAdminUserStatus, adminUpsertAdminUser, getCurrentAdminSession, readStore } from "@/lib/store";
import type { AdminUser, StoreShape } from "@/lib/types";

type UserForm = {
  id?: string;
  name: string;
  avatarUrl: string;
  username: string;
  password: string;
  roleIds: string[];
  status: AdminUser["status"];
};

const emptyForm: UserForm = { name: "", avatarUrl: "", username: "", password: "", roleIds: [], status: "enabled" };

export default function AdminUsersPermissionPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"" | AdminUser["status"]>("");
  const [editing, setEditing] = useState<UserForm | null>(null);
  const session = getCurrentAdminSession();

  const rows = useMemo(() => {
    return store.admin_users.filter((user) => {
      const matchUsername = !username.trim() || user.username.includes(username.trim());
      const matchName = !name.trim() || user.name.includes(name.trim());
      const matchStatus = !status || user.status === status;
      return matchUsername && matchName && matchStatus;
    });
  }, [store.admin_users, username, name, status]);

  const reload = () => setStore(readStore());
  const roleName = (roleId: string) => store.admin_roles.find((role) => role.id === roleId)?.name ?? roleId;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      adminUpsertAdminUser({ ...editing, password: editing.password || undefined });
      setEditing(null);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  const deleteUser = (user: AdminUser) => {
    if (!confirm(`确定删除管理员「${user.username}」吗？`)) return;
    try {
      adminDeleteAdminUser(user.id);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  const toggleStatus = (user: AdminUser) => {
    try {
      adminToggleAdminUserStatus(user.id);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <AdminLayout title="管理员管理">
      <AdminCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input className="admin-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
          <input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入姓名" />
          <select className="admin-input" value={status} onChange={(event) => setStatus(event.target.value as "" | AdminUser["status"])}>
            <option value="">全部状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
          <button className="admin-button-secondary" onClick={() => { setUsername(""); setName(""); setStatus(""); }}>重置</button>
          <button className="admin-button" onClick={reload}>查询</button>
        </div>
      </AdminCard>

      <AdminCard className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="admin-button-secondary" onClick={() => setEditing(emptyForm)}>新增管理员</button>
          <p className="text-xs font-bold text-slate-400">共 {rows.length} 条</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>用户名</th>
                <th>姓名</th>
                <th>状态</th>
                <th>角色</th>
                <th>最后登录时间</th>
                <th>最后登录 IP</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">{user.avatarUrl ? "图" : user.name.slice(0, 1)}</div></td>
                  <td className="font-black text-slate-800">{user.username}</td>
                  <td>{user.name}</td>
                  <td><AdminBadge tone={user.status === "enabled" ? "green" : "slate"}>{user.status === "enabled" ? "启用" : "禁用"}</AdminBadge></td>
                  <td>{user.roleIds.map(roleName).join("、")}</td>
                  <td>{formatTime(user.lastLoginAt)}</td>
                  <td>{user.lastLoginIp || "-"}</td>
                  <td>{formatTime(user.createdAt)}</td>
                  <td>
                    <div className="flex gap-3">
                      <button className="admin-link" onClick={() => setEditing({ id: user.id, name: user.name, avatarUrl: user.avatarUrl ?? "", username: user.username, password: "", roleIds: user.roleIds, status: user.status })}>编辑</button>
                      <button className="admin-link text-amber-600" onClick={() => toggleStatus(user)}>{user.status === "enabled" ? "禁用" : "启用"}</button>
                      <button className="admin-link text-rose-600" onClick={() => deleteUser(user)} disabled={user.id === session?.adminId || user.username === "admin"}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={10} className="py-12 text-center text-slate-400">暂无管理员</td></tr> : null}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {editing ? (
        <div className="admin-modal-backdrop">
          <form onSubmit={submit} className="admin-modal w-full max-w-2xl">
            <div className="admin-modal-title">
              <h2>{editing.id ? "编辑管理员" : "新增管理员"}</h2>
              <button type="button" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="space-y-4 p-6">
              <Field label="姓名" required><input className="admin-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="请输入姓名" /></Field>
              <Field label="头像"><input className="admin-input" value={editing.avatarUrl} onChange={(event) => setEditing({ ...editing, avatarUrl: event.target.value })} placeholder="/images/xxx.png 或图片 URL" /></Field>
              <Field label="用户名" required><input className="admin-input" value={editing.username} onChange={(event) => setEditing({ ...editing, username: event.target.value })} placeholder="请输入用户名" disabled={editing.username === "admin"} /></Field>
              <Field label="密码" required={!editing.id}><input className="admin-input" type="password" value={editing.password} onChange={(event) => setEditing({ ...editing, password: event.target.value })} placeholder={editing.id ? "不填写则不修改" : "请输入密码（至少 8 位）"} /></Field>
              <Field label="角色" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {store.admin_roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={editing.roleIds.includes(role.id)}
                        onChange={() => setEditing((prev) => prev ? { ...prev, roleIds: prev.roleIds.includes(role.id) ? prev.roleIds.filter((item) => item !== role.id) : [...prev.roleIds, role.id] } : prev)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="状态"><select className="admin-input" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as AdminUser["status"] })} disabled={editing.username === "admin"}><option value="enabled">启用</option><option value="disabled">禁用</option></select></Field>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-button-secondary" onClick={() => setEditing(null)}>取消</button>
              <button className="admin-button">提交</button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-600 md:grid-cols-[120px_1fr] md:items-center"><span>{required ? <span className="text-rose-500">*</span> : null} {label}</span>{children}</label>;
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
