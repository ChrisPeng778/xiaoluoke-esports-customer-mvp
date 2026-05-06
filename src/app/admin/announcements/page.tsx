"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import {
  adminArchiveAnnouncement,
  adminSoftDeleteAnnouncement,
  adminToggleAnnouncementPin,
  adminUpsertAnnouncement,
  formatTime,
  readStore,
} from "@/lib/store";
import type { Announcement, AnnouncementStatus, AnnouncementType, AnnouncementVisibleTo, StoreShape } from "@/lib/types";

const typeLabels: Record<AnnouncementType, string> = {
  notice: "通知公告",
  system: "系统公告",
  activity: "活动公告",
  maintenance: "维护公告",
  order: "订单提醒",
};

const visibleLabels: Record<AnnouncementVisibleTo, string> = {
  all: "全部可见",
  customer: "仅顾客端",
  worker: "仅接单员端",
  admin: "仅管理端",
};

const statusLabels: Record<AnnouncementStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

type FormState = {
  id?: string;
  title: string;
  type: AnnouncementType;
  visibleTo: AnnouncementVisibleTo;
  coverImage: string;
  content: string;
  isPinned: boolean;
  sortOrder: string;
  publishAt: string;
  expireAt: string;
  status: AnnouncementStatus;
};

const emptyForm: FormState = {
  title: "",
  type: "notice",
  visibleTo: "all",
  coverImage: "",
  content: "",
  isPinned: false,
  sortOrder: "0",
  publishAt: "",
  expireAt: "",
  status: "published",
};

export default function AdminAnnouncementsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [filters, setFilters] = useState({ title: "", type: "all", status: "all" });
  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rows = useMemo(() => {
    return store.announcements
      .filter((item) => !item.deleted)
      .filter((item) => !filters.title.trim() || item.title.includes(filters.title.trim()))
      .filter((item) => filters.type === "all" || item.type === filters.type)
      .filter((item) => filters.status === "all" || item.status === filters.status)
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return b.sortOrder - a.sortOrder;
        return (b.publishAt || b.createdAt).localeCompare(a.publishAt || a.createdAt);
      });
  }, [filters, store.announcements]);

  const openEdit = (announcement: Announcement) => {
    setMessage("");
    setForm({
      id: announcement.id,
      title: announcement.title,
      type: announcement.type,
      visibleTo: announcement.visibleTo,
      coverImage: announcement.coverImage ?? "",
      content: announcement.content,
      isPinned: announcement.isPinned,
      sortOrder: String(announcement.sortOrder ?? 0),
      publishAt: toLocalInputValue(announcement.publishAt),
      expireAt: toLocalInputValue(announcement.expireAt),
      status: announcement.status,
    });
  };

  const submit = () => {
    if (!form) return;
    setMessage("");
    try {
      adminUpsertAnnouncement({
        id: form.id,
        title: form.title,
        type: form.type,
        visibleTo: form.visibleTo,
        coverImage: form.coverImage,
        content: form.content,
        isPinned: form.isPinned,
        sortOrder: Number(form.sortOrder || 0),
        status: form.status,
        publishAt: fromLocalInputValue(form.publishAt),
        expireAt: fromLocalInputValue(form.expireAt),
      });
      setForm(null);
      refresh();
      setMessage(form.id ? "公告已保存，两端会同步更新。" : "公告已新增，两端会按可见范围同步显示。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  const archive = (id: string) => {
    adminArchiveAnnouncement(id);
    refresh();
    setMessage("公告已归档，顾客端和接单员端不再展示。");
  };

  const togglePin = (id: string) => {
    adminToggleAnnouncementPin(id);
    refresh();
    setMessage("公告置顶状态已更新。");
  };

  const remove = (id: string) => {
    if (!confirm("确定删除该公告吗？删除会做软删除并归档。")) return;
    adminSoftDeleteAnnouncement(id);
    refresh();
    setMessage("公告已删除并归档。");
  };

  return (
    <AdminLayout title="公告列表">
      <div className="space-y-4">
        <AdminCard className="p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_auto_auto]">
            <input className="admin-field" placeholder="请输入公告标题" value={filters.title} onChange={(event) => setFilters({ ...filters, title: event.target.value })} />
            <select className="admin-field" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option value="all">全部类型</option>
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className="admin-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="admin-secondary" onClick={() => setFilters({ title: "", type: "all", status: "all" })}>重置</button>
            <button className="admin-primary" onClick={() => setFilters({ ...filters })}>查询</button>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">公告管理</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">当前营销模块仅开放公告管理。</p>
            </div>
            <button className="admin-primary" onClick={() => { setMessage(""); setForm(emptyForm); }}>新增公告</button>
          </div>
          {message ? <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</p> : null}
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1180px]">
              <thead>
                <tr>{["ID", "公告标题", "公告类型", "可见范围", "是否置顶", "状态", "浏览次数", "发布时间", "创建时间", "操作"].map((item) => <th key={item}>{item}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-slate-500">{item.id.replace("announcement_", "").slice(0, 10)}</td>
                    <td>
                      <p className="font-black text-slate-900">{item.title}</p>
                      <p className="mt-1 max-w-[280px] truncate text-xs font-bold text-slate-400">{item.content}</p>
                    </td>
                    <td><AdminBadge tone="blue">{typeLabels[item.type]}</AdminBadge></td>
                    <td><AdminBadge>{visibleLabels[item.visibleTo]}</AdminBadge></td>
                    <td><AdminBadge tone={item.isPinned ? "amber" : "slate"}>{item.isPinned ? "置顶" : "普通"}</AdminBadge></td>
                    <td><AdminBadge tone={item.status === "published" ? "green" : item.status === "draft" ? "amber" : "slate"}>{statusLabels[item.status]}</AdminBadge></td>
                    <td className="font-black">{item.viewCount ?? 0}</td>
                    <td>{item.publishAt ? formatTime(item.publishAt) : "-"}</td>
                    <td>{formatTime(item.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-3">
                        <button className="admin-link" onClick={() => openEdit(item)}>编辑</button>
                        <button className="font-black text-amber-600" onClick={() => archive(item.id)}>归档</button>
                        <button className="font-black text-slate-600" onClick={() => togglePin(item.id)}>{item.isPinned ? "取消置顶" : "置顶"}</button>
                        <button className="font-black text-rose-500" onClick={() => remove(item.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr><td colSpan={10} className="py-16 text-center font-black text-slate-400">暂无公告</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>

      {form ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{form.id ? "编辑公告" : "新增公告"}</h2>
              <button className="admin-close" onClick={() => setForm(null)}>×</button>
            </div>
            <div className="space-y-4">
              <Field label="公告标题" required>
                <input className="admin-field" maxLength={100} placeholder="请输入公告标题" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </Field>
              <Field label="公告类型" required>
                <select className="admin-field" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AnnouncementType })}>
                  {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="可见范围">
                <select className="admin-field" value={form.visibleTo} onChange={(event) => setForm({ ...form, visibleTo: event.target.value as AnnouncementVisibleTo })}>
                  {Object.entries(visibleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="封面图片">
                <input className="admin-field" placeholder="/images/banners/home-main.jpg 或图片 URL" value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} />
              </Field>
              <Field label="公告内容" required>
                <textarea className="admin-textarea min-h-[220px]" placeholder="请输入公告内容，支持换行显示" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
              </Field>
              <Field label="是否置顶">
                <label className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
                  <input type="checkbox" checked={form.isPinned} onChange={(event) => setForm({ ...form, isPinned: event.target.checked })} />
                  置顶公告
                </label>
              </Field>
              <Field label="排序值">
                <input className="admin-field" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/[^\d-]/g, "") })} />
              </Field>
              <Field label="发布时间">
                <input type="datetime-local" className="admin-field" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} />
              </Field>
              <Field label="过期时间">
                <input type="datetime-local" className="admin-field" value={form.expireAt} onChange={(event) => setForm({ ...form, expireAt: event.target.value })} />
              </Field>
              <Field label="状态">
                <select className="admin-field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AnnouncementStatus })}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {message ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">{message}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="admin-secondary" onClick={() => setForm(null)}>取消</button>
              <button className="admin-primary" onClick={submit}>确定</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-600 md:grid-cols-[120px_1fr] md:items-start">
      <span className="pt-2">{required ? <span className="text-rose-500">* </span> : null}{label}</span>
      {children}
    </label>
  );
}

function toLocalInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}
