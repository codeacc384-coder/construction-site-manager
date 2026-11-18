import React, { useState } from 'react';
import { KeyRound, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { formatInr, getInitials } from '../../utils/format';

export const ProfilePage: React.FC = () => {
  const { managerProfile, sites } = useSiteContext();
  const updateManagerProfile = useBuildFlowStore((s) => s.updateManagerProfile);

  const [phone, setPhone] = useState(managerProfile.phone);
  const [notifSafety, setNotifSafety] = useState(true);
  const [notifProcurement, setNotifProcurement] = useState(true);
  const [notifAttendance, setNotifAttendance] = useState(true);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateManagerProfile({ phone });
    toast.success('Profile contact & notification preferences updated');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    toast.success('Password update request processed via Auth service');
    setCurrPwd('');
    setNewPwd('');
    setPwdOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your Site Manager contact details, assigned sites, delegated approval limits, and account security."
        breadcrumbs={[{ label: 'Account', to: '/' }, { label: 'My Profile' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setPwdOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
            Change Password
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-[#101F35] text-white text-lg font-bold flex items-center justify-center shrink-0">
                {getInitials(managerProfile.name)}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#172B4D] font-display">{managerProfile.name}</h2>
                <div className="text-xs text-[#64748B]">
                  {managerProfile.designation} · <span className="font-mono">{managerProfile.empCode}</span>
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">{managerProfile.department}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Work Email</span>
                <span className="font-medium text-[#172B4D]">{managerProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Reporting Manager</span>
                <span className="font-medium text-[#172B4D]">{managerProfile.reportingManager}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#172B4D] font-display flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Delegated Approval Limits
            </h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-[#64748B]">Purchase Approval Cap</span>
                <strong className="text-[#172B4D]">{formatInr(managerProfile.delegatedLimits.purchaseApprovalLimitInr)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#64748B]">Site Expense Cap</span>
                <strong className="text-[#172B4D]">{formatInr(managerProfile.delegatedLimits.expenseApprovalLimitInr)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#64748B]">Weekly Overtime Cap</span>
                <strong className="text-[#172B4D]">{managerProfile.delegatedLimits.overtimeMaxHoursPerWeek} hrs</strong>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5 text-xs self-start">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] font-display mb-3">Assigned Construction Sites ({sites.length})</h3>
            <div className="space-y-2">
              {sites.map((s) => (
                <div key={s.id} className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#172B4D]">{s.name}</div>
                    <div className="text-[#64748B]">{s.location} · <span className="font-mono">{s.code}</span></div>
                  </div>
                  <span className="font-mono font-semibold text-[#2563EB]">{s.overallProgress}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Mobile Contact Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
            />
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-[#172B4D]">Notification Preferences</div>
            <label className="flex items-center gap-2 text-[#172B4D]">
              <input type="checkbox" checked={notifSafety} onChange={(e) => setNotifSafety(e.target.checked)} />
              <span>Immediate alerts for High & Critical Safety Incidents</span>
            </label>
            <label className="flex items-center gap-2 text-[#172B4D]">
              <input type="checkbox" checked={notifProcurement} onChange={(e) => setNotifProcurement(e.target.checked)} />
              <span>Incoming Material Deliveries & Purchase Request approvals</span>
            </label>
            <label className="flex items-center gap-2 text-[#172B4D]">
              <input type="checkbox" checked={notifAttendance} onChange={(e) => setNotifAttendance(e.target.checked)} />
              <span>Daily muster exceptions & missing check-outs</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Account Password">
        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Current Password</label>
            <input
              type="password"
              value={currPwd}
              onChange={(e) => setCurrPwd(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPwdOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
