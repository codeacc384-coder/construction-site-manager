import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText, FolderOpen, Search, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { DocumentCategory, SiteDocument } from '../../types/domain';

const DOC_CATEGORIES: DocumentCategory[] = [
  'Site Drawings',
  'Work Orders',
  'Project Documents',
  'Safety Documents',
  'Inspection Reports',
  'Material Invoices',
  'Delivery Challans',
  'Equipment Documents',
  'Contractor Documents',
  'Site Photographs',
  'Daily Reports',
];

export const DocumentsPage: React.FC = () => {
  const { activeSite, siteDocuments, managerProfile } = useSiteContext();
  const uploadDocument = useBuildFlowStore((s) => s.uploadDocument);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SiteDocument | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Site Drawings');
  const [version, setVersion] = useState('v1.0');
  const [accessLevel, setAccessLevel] = useState<SiteDocument['accessLevel']>('Site Team');

  const filteredDocs = useMemo(() => {
    return siteDocuments.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (search.trim() && !`${d.title} ${d.category} ${d.uploadedBy}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [siteDocuments, categoryFilter, search]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    uploadDocument({
      siteId: activeSite.id,
      title: title.trim(),
      category,
      version,
      fileSizeLabel: '1.8 MB',
      fileType: 'PDF',
      uploadedBy: managerProfile.name,
      uploadedAt: '2026-11-18',
      accessLevel,
    });
    toast.success('Document metadata saved (Cloudflare R2 private bucket key generated)');
    setTitle('');
    setUploadOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Site Documents"
        description={`Controlled drawings, challans, inspection certificates, and R2-backed document references for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Site Management', to: '/' }, { label: 'Documents' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drawings, challans..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Categories ({siteDocuments.length})</option>
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-[#2563EB]">{doc.fileType} · {doc.version}</span>
                <StatusBadge label={doc.accessLevel} tone="neutral" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D] font-display leading-snug">{doc.title}</h3>
              <div className="text-xs text-[#64748B]">
                {doc.category} · {doc.fileSizeLabel} · Uploaded by {doc.uploadedBy} ({doc.uploadedAt})
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#172B4D] hover:bg-[#F5F7FA]"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => toast.success(`Signed R2 URL issued for ${doc.title}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold hover:bg-blue-100"
              >
                <Download className="w-3.5 h-3.5" />
                Signed Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Site Document"
        subtitle="Files are stored in private Cloudflare R2 storage with site-scoped signed URL access"
      >
        <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Document Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tower A Floor-10 Structural Bar Bending Schedule"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Access Scope</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as SiteDocument['accessLevel'])}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="Site Team">Site Team</option>
              <option value="Manager & Admin">Manager & Admin</option>
              <option value="Safety & QA">Safety & QA</option>
            </select>
          </div>
          <div className="p-4 border border-dashed border-[#CBD5E1] rounded-lg text-center text-[#64748B] bg-[#F5F7FA]">
            <FolderOpen className="w-5 h-5 mx-auto mb-1 text-[#2563EB]" />
            Prototype file selector simulated — generates verified R2 object key on submit.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setUploadOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Upload & Index
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title ?? ''}
        subtitle={previewDoc ? `${previewDoc.category} · ${previewDoc.version} · ${previewDoc.fileSizeLabel}` : ''}
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-8 rounded-xl bg-[#101F35] text-white text-center space-y-2">
              <FileText className="w-10 h-10 mx-auto text-blue-400" />
              <div className="font-semibold">{previewDoc.title}</div>
              <div className="font-mono text-[11px] text-slate-300 break-all">{previewDoc.r2ObjectKey}</div>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Uploaded by {previewDoc.uploadedBy}</span>
              <span className="font-mono">{previewDoc.uploadedAt}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
