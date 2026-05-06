"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminDeleteAdminMenu, adminUpsertAdminMenu, readStore } from "@/lib/store";
import type { AdminMenu, StoreShape } from "@/lib/types";

type MenuForm = {
  id?: string;
  parentId: string;
  type: AdminMenu["type"];
  name: string;
  routeName: string;
  path: string;
  componentPath: string;
  icon: string;
  externalUrl: string;
  activePath: string;
  sortOrder: number;
  visible: boolean;
  cache: boolean;
  hidden: boolean;
  embedded: boolean;
  hiddenTag: boolean;
  permissionKey: string;
  status: AdminMenu["status"];
};

const emptyForm: MenuForm = {
  parentId: "",
  type: "directory",
  name: "",
  routeName: "",
  path: "",
  componentPath: "",
  icon: "",
  externalUrl: "",
  activePath: "",
  sortOrder: 0,
  visible: true,
  cache: false,
  hidden: false,
  embedded: false,
  hiddenTag: false,
  permissionKey: "",
  status: "visible",
};

export default function AdminPermissionMenusPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [path, setPath] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<MenuForm | null>(null);

  const rows = useMemo(() => {
    const treeRows = flattenMenus(store.admin_menus, expanded);
    return treeRows.filter(({ menu }) => {
      const matchName = !keyword.trim() || menu.name.includes(keyword.trim());
      const matchPath = !path.trim() || (menu.path ?? "").includes(path.trim());
      return matchName && matchPath;
    });
  }, [expanded, keyword, path, store.admin_menus]);

  const reload = () => setStore(readStore());

  const openEdit = (menu?: AdminMenu) => {
    if (!menu) {
      setEditing(emptyForm);
      return;
    }
    setEditing({
      id: menu.id,
      parentId: menu.parentId ?? "",
      type: menu.type,
      name: menu.name,
      routeName: menu.routeName ?? "",
      path: menu.path ?? "",
      componentPath: menu.componentPath ?? "",
      icon: menu.icon ?? "",
      externalUrl: menu.externalUrl ?? "",
      activePath: menu.activePath ?? "",
      sortOrder: menu.sortOrder,
      visible: menu.visible,
      cache: menu.cache ?? false,
      hidden: menu.hidden ?? false,
      embedded: menu.embedded ?? false,
      hiddenTag: menu.hiddenTag ?? false,
      permissionKey: menu.permissionKey ?? "",
      status: menu.status,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      adminUpsertAdminMenu({
        ...editing,
        parentId: editing.parentId || null,
        status: editing.visible && !editing.hidden ? "visible" : "hidden",
      });
      setEditing(null);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };

  const deleteMenu = (menu: AdminMenu) => {
    if (!confirm(`确定删除菜单「${menu.name}」吗？`)) return;
    try {
      adminDeleteAdminMenu(menu.id);
      reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <AdminLayout title="菜单管理">
      <AdminCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
          <input className="admin-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入菜单名称" />
          <input className="admin-input" value={path} onChange={(event) => setPath(event.target.value)} placeholder="请输入路由地址" />
          <button className="admin-button-secondary" onClick={() => { setKeyword(""); setPath(""); }}>重置</button>
          <button className="admin-button" onClick={reload}>查询</button>
        </div>
      </AdminCard>

      <AdminCard className="mt-4 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button className="admin-button-secondary" onClick={() => openEdit()}>添加菜单</button>
            <button className="admin-button-secondary" onClick={() => setExpanded((value) => !value)}>{expanded ? "全部收起" : "展开"}</button>
          </div>
          <p className="text-xs font-bold text-slate-400">共 {rows.length} 条</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>菜单名称</th>
                <th>菜单类型</th>
                <th>路由地址</th>
                <th>权限标识</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ menu, depth }) => (
                <tr key={menu.id}>
                  <td className="font-black text-slate-800">
                    <span style={{ paddingLeft: depth * 22 }}>{depth ? "└ " : ""}{menu.name}</span>
                  </td>
                  <td><AdminBadge tone="slate">{menuTypeLabel(menu.type)}</AdminBadge></td>
                  <td>{menu.path || "-"}</td>
                  <td>{menu.permissionKey || "-"}</td>
                  <td>{menu.sortOrder}</td>
                  <td><AdminBadge tone={menu.status === "visible" && menu.visible && !menu.hidden ? "green" : "slate"}>{menu.status === "visible" && menu.visible && !menu.hidden ? "显示" : "隐藏"}</AdminBadge></td>
                  <td>
                    <div className="flex gap-3">
                      <button className="admin-link" onClick={() => openEdit(menu)}>编辑</button>
                      <button className="admin-link text-rose-600" onClick={() => deleteMenu(menu)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">暂无菜单</td></tr> : null}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {editing ? (
        <div className="admin-modal-backdrop">
          <form onSubmit={submit} className="admin-modal w-full max-w-5xl">
            <div className="admin-modal-title">
              <h2>{editing.id ? "编辑菜单" : editing.type === "directory" ? "新建目录" : "添加菜单"}</h2>
              <button type="button" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="space-y-5">
                <Field label="菜单类型">
                  <div className="inline-flex overflow-hidden rounded-xl border border-slate-200">
                    {(["directory", "menu", "button"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`px-5 py-2 text-sm font-black ${editing.type === type ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
                        onClick={() => setEditing({ ...editing, type })}
                      >
                        {menuTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="父级菜单">
                  <select className="admin-input" value={editing.parentId} onChange={(event) => setEditing({ ...editing, parentId: event.target.value })}>
                    <option value="">0</option>
                    {store.admin_menus
                      .filter((menu) => menu.type !== "button" && menu.id !== editing.id)
                      .sort((a, b) => b.sortOrder - a.sortOrder)
                      .map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                  </select>
                </Field>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="显示名称" required><input className="admin-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="如：订单管理" /></Field>
                  <Field label="路由标识"><input className="admin-input" value={editing.routeName} onChange={(event) => setEditing({ ...editing, routeName: event.target.value })} placeholder="如：OrderList" /></Field>
                  <Field label="路由地址" required={editing.type === "menu"}><input className="admin-input" value={editing.path} onChange={(event) => setEditing({ ...editing, path: event.target.value })} placeholder="/admin/orders" /></Field>
                  <Field label="组件路径"><input className="admin-input" value={editing.componentPath} onChange={(event) => setEditing({ ...editing, componentPath: event.target.value })} placeholder="可留空" /></Field>
                  <Field label="图标"><input className="admin-input" value={editing.icon} onChange={(event) => setEditing({ ...editing, icon: event.target.value })} placeholder="可选" /></Field>
                  <Field label="外部链接"><input className="admin-input" value={editing.externalUrl} onChange={(event) => setEditing({ ...editing, externalUrl: event.target.value })} placeholder="https://example.com" /></Field>
                  <Field label="激活路径"><input className="admin-input" value={editing.activePath} onChange={(event) => setEditing({ ...editing, activePath: event.target.value })} placeholder="/admin/orders" /></Field>
                  <Field label="排序"><input className="admin-input" type="number" value={editing.sortOrder} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) })} /></Field>
                </div>

                <Field label="权限标识" required={editing.type === "button"}>
                  <input className="admin-input" value={editing.permissionKey} onChange={(event) => setEditing({ ...editing, permissionKey: event.target.value })} placeholder="如：orders.view" />
                </Field>

                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Toggle label="显示菜单" checked={editing.visible} onChange={(visible) => setEditing({ ...editing, visible, status: visible ? "visible" : "hidden" })} />
                  <Toggle label="页面缓存" checked={editing.cache} onChange={(cache) => setEditing({ ...editing, cache })} />
                  <Toggle label="隐藏菜单" checked={editing.hidden} onChange={(hidden) => setEditing({ ...editing, hidden, status: hidden ? "hidden" : "visible", visible: !hidden })} />
                  <Toggle label="内嵌页面" checked={editing.embedded} onChange={(embedded) => setEditing({ ...editing, embedded })} />
                  <Toggle label="隐藏标签" checked={editing.hiddenTag} onChange={(hiddenTag) => setEditing({ ...editing, hiddenTag })} />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-button-secondary" onClick={() => setEditing(null)}>取消</button>
              <button className="admin-button">确定</button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function flattenMenus(menus: AdminMenu[], expanded: boolean, parentId: string | null = null, depth = 0): Array<{ menu: AdminMenu; depth: number }> {
  const rows = menus.filter((menu) => menu.parentId === parentId).sort((a, b) => b.sortOrder - a.sortOrder);
  return rows.flatMap((menu) => {
    const children = expanded ? flattenMenus(menus, expanded, menu.id, depth + 1) : [];
    return [{ menu, depth }, ...children];
  });
}

function menuTypeLabel(type: AdminMenu["type"]) {
  if (type === "directory") return "目录";
  if (type === "button") return "按钮";
  return "菜单";
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-600 lg:grid-cols-[120px_1fr] lg:items-center">
      <span>{required ? <span className="text-rose-500">*</span> : null} {label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-600">
      {label}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-7 w-12 rounded-full p-1 transition ${checked ? "bg-blue-600" : "bg-slate-200"}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}
