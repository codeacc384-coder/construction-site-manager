import React, { useState } from 'react';
import { LifeBuoy, PhoneCall, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { PageHeader } from '../../components/common/PageHeader';

export const SupportPage: React.FC = () => {
  const { activeSite } = useSiteContext();
  const [topic, setTopic] = useState('GPS / Attendance Sync Issue');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    toast.success(`Support ticket submitted for ${activeSite.code} (${topic})`);
    setMessage('');
  };

  return (
    <div>
      <PageHeader
        title="Help & Support"
        description={`Site operations desk, emergency contacts, and SOP guidance for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Account', to: '/' }, { label: 'Help & Support' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#172B4D] font-display flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#DC2626]" />
              Emergency & Escalation Contacts
            </h2>
            <div className="space-y-2.5 text-[#64748B]">
              <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
                <div className="font-semibold text-[#172B4D]">Site Safety Control Desk</div>
                <div className="font-mono mt-0.5">{activeSite.emergencyContact}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
                <div className="font-semibold text-[#172B4D]">Corporate Procurement Desk</div>
                <div className="font-mono mt-0.5">+91 40 4890 1200 · procurement@apexinfra.in</div>
              </div>
              <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
                <div className="font-semibold text-[#172B4D]">VP Projects (Escalations)</div>
                <div className="font-mono mt-0.5">Vikramaditya Rao · +91 98490 00112</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2 text-xs">
            <h2 className="text-sm font-bold text-[#172B4D] font-display flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-[#2563EB]" />
              Standard Site SOP Reminders
            </h2>
            <ul className="space-y-1.5 text-[#64748B] list-disc pl-4">
              <li>Always verify GRN quantity in Material Receipts before releasing supplier vehicles.</li>
              <li>Submit Daily Site Diary before 07:00 PM; use Amendments for post-submission corrections.</li>
              <li>Critical safety incidents automatically alert Company Admin and halt zone activity.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 text-xs self-start">
          <h2 className="text-sm font-bold text-[#172B4D] font-display">Raise Operational Support Ticket</h2>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Issue Category</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option>GPS / Attendance Sync Issue</option>
              <option>Approval Limit / Delegation Request</option>
              <option>Material Catalog / Inventory SKU Request</option>
              <option>Contractor Compliance / Gate Pass Issue</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Description</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the site issue, employee/PO code, and urgency..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
