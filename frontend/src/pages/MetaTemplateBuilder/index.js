import React, { useState, useEffect, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, Chip, IconButton, Tooltip } from "@material-ui/core";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MetaTemplateEditor from "./MetaTemplateEditor";

const STATUS_TONES = {
  draft: { bg: "#e2e8f0", color: "#475569", label: "Rascunho" },
  pending: { bg: "#fef3c7", color: "#92400e", label: "Pendente" },
  approved: { bg: "#d1fae5", color: "#047857", label: "Aprovado" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejeitado" },
};

const useStyles = makeStyles((theme) => ({
  newBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    textTransform: "none",
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 110px 110px 90px",
    gap: 12,
    alignItems: "center",
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #f1f5f9",
    borderRadius: 12,
    marginBottom: 8,
    transition: "all .15s",
    "&:hover": { borderColor: "#a7f3d0" },
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr auto",
    },
  },
  name: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  meta: { fontSize: 11, color: "#64748b", display: "flex", gap: 8, marginTop: 2 },
  metaItem: { display: "inline-flex", alignItems: "center", gap: 4 },
  delBtn: {
    color: "#ef4444",
    background: "#fef2f2",
    "&:hover": { background: "#fee2e2" },
  },
  editBtn: {
    color: "#0f766e",
    background: "#ccfbf1",
    "&:hover": { background: "#99f6e4" },
  },
  empty: {
    padding: 32,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
  },
}));

const MetaTemplateBuilder = () => {
  const classes = useStyles();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/meta-templates");
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    try {
      const { data } = await api.post("/meta-templates", {
        name: "novo_modelo",
        templateType: "standard",
        language: "pt_BR",
        category: "Utility",
      });
      setEditingId(data.id);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este modelo? Esta ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/meta-templates/${id}`);
      setTemplates((arr) => arr.filter((t) => t.id !== id));
      toast.success("Modelo excluído");
    } catch (err) {
      toastError(err);
    }
  };

  const handleBackFromEditor = () => {
    setEditingId(null);
    fetchTemplates();
  };

  if (editingId) {
    return <MetaTemplateEditor templateId={editingId} onBack={handleBackFromEditor} />;
  }

  return (
    <div>
      <PageHeader
        icon={<FileText size={22} />}
        title="Modelos da Meta"
        subtitle="Crie, edite e envie modelos de mensagem do WhatsApp para suas campanhas."
        actions={
          <Button className={classes.newBtn} startIcon={<Plus size={16} />} onClick={handleCreate}>
            Novo modelo
          </Button>
        }
      />

      <div style={{ marginTop: 16 }}>
        <SectionCard>
          {loading ? (
            <div className={classes.empty}>Carregando…</div>
          ) : templates.length === 0 ? (
            <div className={classes.empty}>
              Nenhum modelo ainda. Clique em <strong>Novo modelo</strong> para começar.
            </div>
          ) : (
            templates.map((t) => {
              const tone = STATUS_TONES[t.status] || STATUS_TONES.draft;
              return (
                <div key={t.id} className={classes.row}>
                  <div>
                    <div className={classes.name}>{t.name || "Sem nome"}</div>
                    <div className={classes.meta}>
                      <span className={classes.metaItem}>{t.templateType}</span>
                      <span>•</span>
                      <span className={classes.metaItem}>{t.language}</span>
                      <span>•</span>
                      <span className={classes.metaItem}>{t.category}</span>
                      <span>•</span>
                      <span className={classes.metaItem}>
                        <Clock size={10} />
                        {new Date(t.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Chip
                    size="small"
                    label={tone.label}
                    style={{ background: tone.bg, color: tone.color, fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Etapa {Math.min((t.currentStep || 0) + 1, 6)}/6
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" className={classes.editBtn} onClick={() => setEditingId(t.id)}>
                        <Edit3 size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" className={classes.delBtn} onClick={() => handleDelete(t.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </SectionCard>
      </div>
    </div>
  );
};

const MetaTemplateBuilderGuarded = (props) => {
  // eslint-disable-next-line global-require
  const useCanManageMeta = require("../../hooks/useCanManageMeta").default;
  // eslint-disable-next-line global-require
  const LockedPage = require("../../components/LockedPage").default;
  const { allowed } = useCanManageMeta();
  if (!allowed) {
    return (
      <LockedPage
        title="Modelos da Meta bloqueados"
        description="A criação e o envio de modelos para aprovação da Meta são restritos a super usuários e administradores da empresa."
        resource="Create Meta Template"
      />
    );
  }
  return <MetaTemplateBuilder {...props} />;
};

export default MetaTemplateBuilderGuarded;
