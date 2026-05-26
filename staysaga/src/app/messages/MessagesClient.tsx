"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  MoreVertical, 
  X, 
  Calendar, 
  User, 
  ArrowLeft, 
  Loader2, 
  Phone, 
  Briefcase, 
  Shield, 
  HelpCircle,
  Archive 
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

type MessagesClientProps = {
  conversations: Array<{
    booking: any;
    messages: any[];
  }>;
  selectedBookingIdFromUrl?: string;
  lang: string;
  currency: string;
  sendMessageAction: (bookingId: string, message: string) => Promise<{ success?: boolean; error?: string; warning?: string }>;
  userFullName?: string;
  userAvatar?: string;
  userId?: string;
};

export default function MessagesClient({
  conversations,
  selectedBookingIdFromUrl,
  lang,
  currency,
  sendMessageAction,
  userFullName = "User",
  userAvatar = "",
  userId = "",
}: MessagesClientProps) {
  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  // Filters state: 'all' | 'stays' | 'past'
  const [filter, setFilter] = useState<"all" | "stays" | "past">("all");
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);
  const [openItemMenuId, setOpenItemMenuId] = useState<string | null>(null);
  const [archivedBookingIds, setArchivedBookingIds] = useState<string[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string>(
    selectedBookingIdFromUrl || conversations[0]?.booking?.id || ""
  );

  // Messages state for active conversation
  const [localConversations, setLocalConversations] = useState(conversations);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-sync local state when prop updates
  useEffect(() => {
    setLocalConversations(conversations);
    if (!selectedConvoId && conversations[0]?.booking?.id) {
      setSelectedConvoId(conversations[0].booking.id);
    }
  }, [conversations]);

  // Real-time Supabase Messages Subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("realtime-messages-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_messages",
        },
        (payload) => {
          const newMsg = payload.new;
          
          setLocalConversations((prev) => {
            return prev.map((convo) => {
              if (convo.booking.id === newMsg.booking_id) {
                // Check if message is already present (optimistic vs database insert)
                const exists = convo.messages.some(
                  (m) =>
                    m.id === newMsg.id ||
                    (m.id.startsWith("temp-") &&
                      m.message === newMsg.message &&
                      m.sender_role === newMsg.sender_role)
                );
                
                if (exists) {
                  // Replace the optimistic message with actual DB record
                  return {
                    ...convo,
                    messages: convo.messages.map((m) =>
                      m.id.startsWith("temp-") &&
                      m.message === newMsg.message &&
                      m.sender_role === newMsg.sender_role
                        ? newMsg
                        : m
                    ),
                  };
                }
                
                return {
                  ...convo,
                  messages: [...convo.messages, newMsg],
                };
              }
              return convo;
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Find active conversation
  const activeConvo = localConversations.find(c => c.booking.id === selectedConvoId);
  const activeMessages = activeConvo?.messages || [];
  const activeBooking = activeConvo?.booking;
  const isHost = activeBooking?.homestay?.owner_id === userId;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConvoId, activeMessages]);

  // Filter conversations
  const filteredConvos = localConversations.filter(convo => {
    const today = new Date().toISOString().split("T")[0];
    const checkOut = convo.booking.check_out_date || "";
    const isPast = checkOut < today;
    const isArchived = archivedBookingIds.includes(convo.booking.id);

    if (filter === "past") {
      return isArchived || isPast;
    }
    
    // Hide archived threads from 'all' or 'stays' tabs
    if (isArchived) return false;
    
    if (filter === "stays") return !isPast;
    return true; // all
  });

  // Handle Send Message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvoId) return;

    const messageToSend = inputText;
    setInputText("");
    setIsSending(true);

    // Optimistically update UI
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      booking_id: selectedConvoId,
      sender_role: isHost ? "PARTNER" : "USER",
      sender_id: userId,
      message: messageToSend,
      created_at: new Date().toISOString(),
      is_read: true,
    };

    setLocalConversations(prev =>
      prev.map(convo => {
        if (convo.booking.id === selectedConvoId) {
          return {
            ...convo,
            messages: [...convo.messages, optimisticMessage],
          };
        }
        return convo;
      })
    );

    try {
      const res = await sendMessageAction(selectedConvoId, messageToSend);
      if (res?.error) {
        toast.error(res.error);
        // Revert optimistic update
        setLocalConversations(prev =>
          prev.map(convo => {
            if (convo.booking.id === selectedConvoId) {
              return {
                ...convo,
                messages: convo.messages.filter(m => m.id !== tempId),
              };
            }
            return convo;
          })
        );
      } else {
        if (res?.warning) {
          toast.success(res.warning);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Không thể gửi tin nhắn.", "Could not send message."));
    } finally {
      setIsSending(false);
    }
  }

  // Format booking status for header
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "PENDING":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t("Đã xác nhận", "Confirmed")}</span>;
      case "CANCELLED":
        return <span className="bg-red-50 text-red-650 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t("Đã hủy", "Cancelled")}</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  // Format relative time text for list items
  const relativeTimeText = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const today = new Date();
      const diffMs = today.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(d, "HH:mm");
      } else if (diffDays === 1) {
        return t("Hôm qua", "Yesterday");
      } else {
        return format(d, "dd/MM");
      }
    } catch {
      return "";
    }
  };

  // Group messages by calendar date string
  const groupMessagesByDate = (msgs: any[]) => {
    const groups: { [key: string]: any[] } = {};
    msgs.forEach((m) => {
      const dateStr = format(new Date(m.created_at), "yyyy-MM-dd");
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(m);
    });
    return groups;
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col overflow-hidden">
      
      {/* Premium Full-Width Brand Header */}
      <header className="bg-rose-600 text-white h-14 px-6 flex items-center justify-between shrink-0 shadow-sm border-b border-rose-700/50">
        <div className="flex items-center gap-6">
          <Link href="/bookings" className="text-xl font-black tracking-tight flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span>StaySaga Inbox</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-5 text-sm font-bold">
          <span className="cursor-pointer hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors">{currency}</span>
          
          <div className="w-5 h-5 rounded-full bg-red-650 flex items-center justify-center border border-red-750 shadow-sm relative overflow-hidden shrink-0 cursor-pointer">
            <span className="text-yellow-400 text-[10px] leading-none">★</span>
          </div>
          
          <HelpCircle className="w-5 h-5 cursor-pointer hover:bg-rose-700 p-0.5 rounded-md transition-colors" />
          
          <span className="hidden md:inline cursor-pointer hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors">
            {t("Đăng chỗ nghỉ của Quý vị", "List your property")}
          </span>
          
          <div className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800/80 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border border-rose-500/20">
            <div className="h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-rose-900 font-black text-xs shadow-inner">
              {userFullName?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:inline text-xs font-extrabold max-w-[150px] truncate">
              {userFullName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Messaging Fluid Viewport */}
      <div className="flex-1 flex w-full h-[calc(100vh-56px)] overflow-hidden">
        
        {/* Left Pane: Conversations List Sidebar */}
        <div className={`w-full md:w-[350px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden ${selectedConvoId ? 'hidden md:flex' : 'flex'}`}>
          {/* Filters header matching Booking.com screenshot */}
          <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
            <h2 className="font-extrabold text-base text-slate-900 mb-3">{t("Hộp thư thoại", "Conversations")}</h2>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  filter === 'all'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t("Tất cả", "All")}
              </button>
              <button
                onClick={() => setFilter("stays")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  filter === 'stays'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t("Chỗ nghỉ", "Stays")}
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  filter === 'past'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t("Đã lưu trữ", "Archived")}
              </button>
            </div>
          </div>

          {/* Conversations scroll stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConvos.length > 0 ? (
              filteredConvos.map(convo => {
                const isActive = convo.booking.id === selectedConvoId;
                const lastMsg = convo.messages[convo.messages.length - 1];
                const city = convo.booking.homestay?.city || "TP. Hồ Chí Minh";
                const img = convo.booking.homestay?.homestay_images?.[0]?.url || "/images/fallback-hotel.jpg";

                return (
                  <button
                    key={convo.booking.id}
                    onClick={() => {
                      setSelectedConvoId(convo.booking.id);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left p-4 flex gap-3 transition-all relative border-b border-slate-100/80 cursor-pointer ${
                      isActive ? "bg-rose-50/30 hover:bg-rose-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Active Indicator Left Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600" />
                    )}
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0 border border-slate-100 shadow-sm bg-slate-50">
                      <SafeImage src={img} alt={city} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate pr-2">
                          {convo.booking.homestay?.name || city}
                        </h4>
                        <div className="flex flex-col items-end shrink-0 relative">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {relativeTimeText(lastMsg?.created_at || convo.booking.created_at)}
                          </span>
                          
                          {/* 3-Dots Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setOpenItemMenuId(openItemMenuId === convo.booking.id ? null : convo.booking.id);
                            }}
                            className="mt-1 text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-slate-100 rounded-full flex items-center justify-center cursor-pointer"
                            title={t("Lưu trữ cuộc trò chuyện", "Archive conversation")}
                          >
                            <span className="text-[14px] leading-none font-bold tracking-widest">•••</span>
                          </button>

                          {/* Popover Menu */}
                          {openItemMenuId === convo.booking.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-20 cursor-default" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setOpenItemMenuId(null);
                                }} 
                              />
                              <div className="absolute right-0 top-full mt-1 bg-white border-2 border-blue-600 rounded-[10px] shadow-lg z-30 py-1.5 px-2.5 min-w-[130px] animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const isArchived = archivedBookingIds.includes(convo.booking.id);
                                    if (isArchived) {
                                      setArchivedBookingIds(prev => prev.filter(id => id !== convo.booking.id));
                                      toast.success(t("Đã bỏ lưu trữ cuộc trò chuyện", "Conversation unarchived"));
                                    } else {
                                      setArchivedBookingIds(prev => [...prev, convo.booking.id]);
                                      toast.success(t("Đã lưu trữ cuộc trò chuyện", "Conversation archived"));
                                    }
                                    setOpenItemMenuId(null);
                                  }}
                                  className="w-full text-left py-1 text-slate-900 font-bold text-[13px] flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Archive className="w-[18px] h-[18px] text-slate-700 shrink-0" />
                                  <span>
                                    {archivedBookingIds.includes(convo.booking.id)
                                      ? t("Bỏ lưu trữ", "Unarchive")
                                      : t("Lưu trữ", "Lưu trữ")}
                                  </span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {format(new Date(convo.booking.check_in_date), "d MMM")} - {format(new Date(convo.booking.check_out_date), "d MMM")}
                      </p>
                      
                      {lastMsg && (
                        <p className="text-xs text-slate-500 truncate mt-2 leading-relaxed font-semibold">
                          {lastMsg.sender_role === "USER" ? t("Bạn: ", "You: ") : ""}
                          {lastMsg.message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-450 text-xs">
                {t("Không tìm thấy cuộc trò chuyện nào.", "No conversations found.")}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window Frame */}
        <div className={`flex-1 bg-white flex flex-col overflow-hidden h-full ${!selectedConvoId ? 'hidden md:flex' : 'flex'}`}>
          {activeBooking ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvoId("")}
                    className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 leading-tight">
                      {activeBooking.homestay?.name || activeBooking.homestay?.city || "StaySaga Homestay"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(activeBooking.check_in_date), "d MMM")} - {format(new Date(activeBooking.check_out_date), "d MMM, yyyy")}
                      </span>
                      <span className="text-xs text-slate-350 font-semibold">·</span>
                      {getStatusBadge(activeBooking.status)}
                    </div>
                  </div>
                </div>
                
                {/* 3-Dots Action Popover Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors border border-slate-150 cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-slate-800 font-bold animate-in fade-in slide-in-from-top-1">
                        <a
                          href={`tel:${activeBooking.homestay?.owner?.phone || "+84345775677"}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-800"
                        >
                          <Phone className="w-4 h-4 text-slate-450" />
                          <span>{activeBooking.homestay?.owner?.phone || "+84345775677"}</span>
                        </a>
                        <Link
                          href={`/bookings/${activeBooking.id}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-800 border-t border-slate-100"
                        >
                          <Briefcase className="w-4 h-4 text-slate-450" />
                          <span>{t("Quản lý đơn đặt", "Manage booking")}</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Viewport Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 flex flex-col space-y-6">
                
                {/* 1. Large Circle Property Avatar Header */}
                <div className="flex flex-col items-center justify-center py-6 text-center shrink-0 border-b border-slate-200/60 pb-8 mb-2 max-w-xl mx-auto w-full">
                  <div className="w-24 h-24 rounded-full overflow-hidden relative border-2 border-white shadow-md mb-4 bg-slate-100">
                    <SafeImage 
                      src={activeBooking.homestay?.homestay_images?.[0]?.url || "/images/fallback-hotel.jpg"} 
                      alt="Property logo" 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 leading-snug">
                    {activeBooking.homestay?.name || "StaySaga Homestay"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {format(new Date(activeBooking.check_in_date), "d MMM")} - {format(new Date(activeBooking.check_out_date), "d MMM, yyyy")}
                  </p>
                  <div className="mt-2.5">
                    {getStatusBadge(activeBooking.status)}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-5 text-xs font-bold">
                    <a 
                      href={`tel:${activeBooking.homestay?.owner?.phone || "+84345775677"}`} 
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs text-slate-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-450" />
                      <span>{activeBooking.homestay?.owner?.phone || "+84345775677"}</span>
                    </a>
                    <Link 
                      href={`/bookings/${activeBooking.id}`} 
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs text-slate-700 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-450" />
                      <span>{t("Quản lý đơn đặt", "Manage booking")}</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Security Shield Notice Box */}
                {showSecurityNotice && (
                  <div className="bg-amber-50/30 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 text-xs text-slate-700 leading-relaxed shadow-xs max-w-2xl mx-auto w-full mb-4 relative">
                    <div className="p-2 bg-amber-500/10 rounded-xl shrink-0 mt-0.5">
                      <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                    </div>
                    <div className="flex-1 pr-6">
                      <h4 className="font-extrabold text-slate-900 mb-0.5">{t("Tránh hoạt động khả nghi", "Avoid suspicious activity")}</h4>
                      <p className="text-slate-600 font-medium text-[11px]">
                        {t(
                          "StaySaga.com tuyệt đối không yêu cầu bạn cung cấp thông tin tài khoản hoặc thông tin thanh toán qua điện thoại, email hoặc trò chuyện (ví dụ: WhatsApp). Nếu bạn có điều gì nghi ngờ, vui lòng báo cho chúng tôi.",
                          "StaySaga.com will never ask you to provide account or payment details via phone, email, or chat (e.g. WhatsApp). If you have any doubts, please report to StaySaga."
                        )}
                      </p>
                      <button 
                        type="button" 
                        className="mt-2 text-rose-600 hover:text-rose-700 font-bold block cursor-pointer"
                        onClick={() => toast(t("Bạn sẽ được kết nối với bộ phận trợ giúp.", "Connecting you to help support."))}
                      >
                        {t("Xem thêm", "Read more")}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSecurityNotice(false)}
                      className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                      aria-label="Close warning"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 3. Messages List grouped by Date */}
                <div className="flex-1 flex flex-col justify-end space-y-4">
                  {(() => {
                    const grouped = groupMessagesByDate(activeMessages);
                    return Object.keys(grouped).sort().map((dateStr) => {
                      const dateMsgs = grouped[dateStr];
                      const d = new Date(dateStr);
                      let dateHeader = format(d, "dd/MM/yyyy");
                      const today = format(new Date(), "yyyy-MM-dd");
                      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
                      
                      if (dateStr === today) {
                        dateHeader = t("Hôm nay", "Today");
                      } else if (dateStr === yesterday) {
                        dateHeader = t("Hôm qua", "Yesterday");
                      } else {
                        dateHeader = lang === "EN" 
                          ? format(d, "EEEE, d MMM") 
                          : `Thứ ${format(d, "i") === "1" ? "Nhật" : Number(format(d, "i")) + 1}, ngày ${format(d, "d")} thg ${format(d, "M")}`;
                      }

                      return (
                        <div key={dateStr} className="space-y-4 flex flex-col">
                          {/* Date Label Header */}
                          <div className="flex justify-center my-2 shrink-0">
                            <span className="bg-slate-200/60 border border-slate-300/20 text-slate-500 text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                              {dateHeader}
                            </span>
                          </div>

                          {dateMsgs.map((msg) => {
                            const isMe = msg.sender_id === userId || (msg.sender_role === (isHost ? "PARTNER" : "USER"));
                            const isSys = msg.sender_role === "SYSTEM";

                            if (isSys) {
                              return (
                                <div key={msg.id} className="flex justify-center my-2 animate-in fade-in duration-300">
                                  <div className="bg-white/80 border border-slate-200/80 text-slate-650 text-xs font-semibold px-5 py-3 rounded-xl text-center max-w-sm sm:max-w-md shadow-xs">
                                    {msg.message}
                                  </div>
                                </div>
                              );
                            }

                            const otherAvatar = isHost
                              ? (activeBooking.homestay?.owner?.avatar_url || "")
                              : (activeBooking.homestay?.homestay_images?.[0]?.url || "/images/fallback-hotel.jpg");
                            const otherName = isHost
                              ? (activeBooking.homestay?.owner?.full_name || "Guest")
                              : (activeBooking.homestay?.name || "Host");

                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-2.5 max-w-[80%] ${
                                  isMe ? "self-end flex-row-reverse" : "self-start"
                                } animate-in fade-in duration-300`}
                              >
                                {/* Left/Right Avatar Profile */}
                                {isMe ? (
                                  userAvatar ? (
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border relative shadow-sm border-rose-200 bg-white">
                                      <SafeImage src={userAvatar} alt="My avatar" fill className="object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border shadow-inner bg-rose-100 text-rose-600 border-rose-200">
                                      <User className="w-4 h-4" />
                                    </div>
                                  )
                                ) : (
                                  isHost && !otherAvatar ? (
                                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border shadow-inner bg-slate-100 text-slate-500 border-slate-200">
                                      <span className="text-xs font-black uppercase">{otherName[0]}</span>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white relative shadow-sm">
                                      <SafeImage 
                                        src={otherAvatar} 
                                        alt={otherName} 
                                        fill 
                                        className="object-cover" 
                                      />
                                    </div>
                                  )
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  <div className={`p-3.5 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-xs ${
                                    isMe 
                                      ? "bg-rose-600 text-white rounded-tr-none font-medium" 
                                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium"
                                  }`}>
                                    {msg.message}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                                    {format(new Date(msg.created_at), "HH:mm")}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input form footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-250 bg-white flex items-center gap-3 shrink-0">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={t("Viết tin nhắn...", "Write a message...")}
                  className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none h-12 scrollbar-hide max-h-24"
                  rows={1}
                />
                
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md disabled:bg-rose-350 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/20">
              <MessageSquare className="w-14 h-14 text-slate-200 mb-3" />
              <p className="text-sm font-extrabold text-slate-550">
                {t("Hãy chọn một cuộc trò chuyện để nhắn tin.", "Select a conversation to start messaging.")}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
