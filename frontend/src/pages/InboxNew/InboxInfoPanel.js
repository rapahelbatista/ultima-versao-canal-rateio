import React, { useEffect, useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
  Avatar,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Tooltip,
  Chip,
  Popover,
} from "@material-ui/core";
import {
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  LocalOffer as TagIcon,
  AssignmentInd as AgentIcon,
  Notes as NotesIcon,
  AttachFile as FilesIcon,
  Equalizer as ActivityIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  GetApp as DownloadIcon,
  InsertDriveFile as FileIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@material-ui/icons";
import api from "../../services/api";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";

const Section = ({ icon, title, right, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="iip-section">
      <div className="iip-section-header" onClick={() => setOpen((o) => !o)}>
        <div className="iip-section-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="iip-section-right">
          {right}
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </div>
      </div>
      {open && <div className="iip-section-body">{children}</div>}
    </div>
  );
};

const initials = (name) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
};

const InboxInfoPanel = ({ ticket, contact, onClose }) => {
  const history = useHistory();
  const [tags, setTags] = useState([]);
  const [contactTags, setContactTags] = useState([]);
  const [agents, setAgents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, media: 0 });
  const [loadingNote, setLoadingNote] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [tagAnchor, setTagAnchor] = useState(null);
  const [tagSearch, setTagSearch] = useState("");

  const loadAll = useCallback(async () => {
    if (!contact?.id || !ticket?.id) return;
    try {
      const [tagsRes, allTagsRes, notesRes, msgsRes, usersRes] = await Promise.all([
        api.get(`/contacts/${contact.id}`).catch(() => ({ data: contact })),
        api.get(`/tags/list`).catch(() => ({ data: [] })),
        api.get(`/ticketNotes/list`, { params: { ticketId: ticket.id } }).catch(() => ({ data: [] })),
        api.get(`/messages/${ticket.id}`, { params: { pageNumber: 1 } }).catch(() => ({ data: { messages: [] } })),
        api.get(`/users/`).catch(() => ({ data: { users: [] } })),
      ]);
      setContactTags(tagsRes?.data?.tags || []);
      setTags(Array.isArray(allTagsRes?.data) ? allTagsRes.data : (allTagsRes?.data?.tags || []));
      setNotes(Array.isArray(notesRes?.data) ? notesRes.data : []);
      const msgs = msgsRes?.data?.messages || [];
      const media = msgs.filter((m) => m.mediaUrl).map((m) => ({
        id: m.id,
        url: m.mediaUrl,
        name: m.body || "arquivo",
      }));
      setFiles(media);
      setStats({ total: msgsRes?.data?.count || msgs.length, media: media.length });
      setAgents(usersRes?.data?.users || []);
    } catch (e) {
      // silencioso
    }
  }, [contact, ticket]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !ticket?.id) return;
    try {
      setLoadingNote(true);
      const { data } = await api.post(`/ticketNotes`, {
        ticketId: ticket.id,
        contactId: contact?.id,
        userId: ticket?.user?.id,
        note: newNote,
      });
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
      toast.success("Nota adicionada");
    } catch (e) {
      toastError(e);
    } finally {
      setLoadingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/ticketNotes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      toastError(e);
    }
  };

  const handleAssignAgent = async (userId) => {
    try {
      await api.put(`/tickets/${ticket.id}`, { userId });
      toast.success("Agente atribuído");
    } catch (e) {
      toastError(e);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta conversa?")) return;
    try {
      await api.delete(`/tickets/${ticket.id}`);
      toast.success("Conversa excluída");
      onClose?.();
    } catch (e) {
      toastError(e);
    }
  };

  const syncContactTags = async (nextTags) => {
    if (!contact?.id) return;
    try {
      await api.post(`/tags/sync`, { contactId: contact.id, tags: nextTags });
      setContactTags(nextTags);
    } catch (e) {
      toastError(e);
    }
  };

  const handleAddTag = (tag) => {
    if (contactTags.some((t) => t.id === tag.id)) return;
    syncContactTags([...contactTags, tag]);
  };

  const handleRemoveTag = (tagId) => {
    syncContactTags(contactTags.filter((t) => t.id !== tagId));
  };

  return (
    <aside className="inbox-info-panel">
      {/* Header */}
      <div className="iip-header">
        <strong>Info do Chat</strong>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Contact summary */}
      <div className="iip-contact-card">
        <Avatar src={contact?.urlPicture} className="iip-avatar">
          {!contact?.urlPicture && initials(contact?.name)}
        </Avatar>
        <div className="iip-contact-name">{contact?.name || "(sem nome)"}</div>
        <div className="iip-contact-phone">{contact?.number ? `+${contact.number}` : ""}</div>
      </div>

      <div className="iip-scroll">
        {/* INFO DO CONTATO */}
        <Section icon={<PersonIcon fontSize="small" />} title="INFO DO CONTATO">
          <div className="iip-row">
            <span className="iip-row-label">Nome</span>
            <span className="iip-row-value">{contact?.name || "-"}</span>
          </div>
          <div className="iip-row">
            <span className="iip-row-label">Número de Celular</span>
            <span className="iip-row-value">{contact?.number ? `+${contact.number}` : "-"}</span>
          </div>
          <div className="iip-row">
            <span className="iip-row-label">Channel</span>
            <span className="iip-row-value">{ticket?.channel || ticket?.whatsapp?.name || "-"}</span>
          </div>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SaveIcon fontSize="small" />}
            className="iip-btn-outline"
          >
            Save as Contact
          </Button>
        </Section>

        {/* ETIQUETAS */}
        <Section icon={<TagIcon fontSize="small" />} title="ETIQUETAS" right={<a className="iip-manage">Manage</a>}>
          <div className="iip-tags">
            {contactTags.length > 0 ? (
              contactTags.map((tag) => (
                <Chip
                  key={tag.id}
                  size="small"
                  label={tag.name}
                  onDelete={() => {}}
                  className="iip-tag"
                  style={{ background: tag.color ? `${tag.color}22` : "#fee2e2", color: tag.color || "#b91c1c" }}
                />
              ))
            ) : (
              <span className="iip-empty">Sem etiquetas</span>
            )}
            <Chip size="small" label="+ new tag" className="iip-tag iip-tag-new" />
          </div>
        </Section>

        {/* AGENTE */}
        <Section icon={<AgentIcon fontSize="small" />} title="AGENTE ATRIBUÍDO">
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Adicionar agente..."
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
          />
          {agentQuery && (
            <div className="iip-agents-list">
              {agents
                .filter((a) => a.name?.toLowerCase().includes(agentQuery.toLowerCase()))
                .slice(0, 5)
                .map((a) => (
                  <div
                    key={a.id}
                    className="iip-agent-item"
                    onClick={() => {
                      handleAssignAgent(a.id);
                      setAgentQuery("");
                    }}
                  >
                    <Avatar style={{ width: 24, height: 24, fontSize: 11 }}>{initials(a.name)}</Avatar>
                    <span>{a.name}</span>
                  </div>
                ))}
            </div>
          )}
          {ticket?.user && (
            <div className="iip-agent-current">
              <Avatar style={{ width: 28, height: 28, fontSize: 12 }}>{initials(ticket.user.name)}</Avatar>
              <span>{ticket.user.name}</span>
            </div>
          )}
        </Section>

        {/* NOTAS */}
        <Section
          icon={<NotesIcon fontSize="small" />}
          title="NOTAS"
          right={<span className="iip-count">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>}
        >
          {notes.map((n) => (
            <div key={n.id} className="iip-note">
              <div className="iip-note-head">
                <strong>{n.user?.name || "Usuário"}</strong>
                <IconButton size="small" onClick={() => handleDeleteNote(n.id)}>
                  <DeleteIcon fontSize="small" style={{ color: "#ef4444" }} />
                </IconButton>
              </div>
              <div className="iip-note-body">{n.note}</div>
            </div>
          ))}
          <div className="iip-note-input">
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Toque para adicionar uma nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
            />
            {loadingNote && <CircularProgress size={16} style={{ marginTop: 6 }} />}
          </div>
        </Section>

        {/* ARQUIVOS */}
        <Section icon={<FilesIcon fontSize="small" />} title="ARQUIVOS COMPARTILHADOS">
          {files.length === 0 ? (
            <span className="iip-empty">Nenhum arquivo</span>
          ) : (
            files.slice(0, 5).map((f) => (
              <div key={f.id} className="iip-file">
                <FileIcon fontSize="small" style={{ color: "#10b981" }} />
                <span className="iip-file-name">{f.name}</span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                  <IconButton size="small">
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </a>
              </div>
            ))
          )}
        </Section>

        {/* ATIVIDADE */}
        <Section icon={<ActivityIcon fontSize="small" />} title="ATIVIDADE">
          <div className="iip-activity-row">
            <span>Total Messages</span>
            <strong className="iip-activity-num">{stats.total}</strong>
          </div>
          <div className="iip-activity-row">
            <span>Media Files</span>
            <strong className="iip-activity-num">{stats.media}</strong>
          </div>
        </Section>

        <Button
          fullWidth
          startIcon={<DeleteIcon fontSize="small" />}
          className="iip-btn-delete"
          onClick={handleDeleteTicket}
        >
          Excluir Conversa
        </Button>
      </div>
    </aside>
  );
};

export default InboxInfoPanel;
