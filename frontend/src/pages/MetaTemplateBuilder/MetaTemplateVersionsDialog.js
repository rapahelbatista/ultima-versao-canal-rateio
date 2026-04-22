import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Button, Tooltip, Chip } from "@material-ui/core";
import { History, RotateCcw, Trash2, X, Clock } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const MetaTemplateVersionsDialog = ({ open, onClose, templateId, onRestored }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/meta-templates/${templateId}/versions`);
        if (active) setVersions(Array.isArray(data) ? data : []);
      } catch (err) {
        toastError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, templateId]);

  const handleRestore = async (versionId) => {
    if (!window.confirm("Restaurar esta versão? As alterações atuais serão substituídas.")) return;
    try {
      await api.post(`/meta-templates/${templateId}/versions/${versionId}/restore`);
      toast.success("Versão restaurada");
      onRestored && onRestored();
      onClose();
    } catch (err) { toastError(err); }
  };

  const handleDelete = async (versionId) => {
    try {
      await api.delete(`/meta-templates/${templateId}/versions/${versionId}`);
      setVersions((arr) => arr.filter((v) => v.id !== versionId));
    } catch (err) { toastError(err); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <History size={16} /> Histórico de versões
        </span>
        <IconButton size="small" onClick={onClose}><X size={16} /></IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ padding: 16, color: "#64748b" }}>Carregando…</div>
        ) : versions.length === 0 ? (
          <div style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>
            Nenhum snapshot ainda. Edite o modelo para gerar versões automáticas.
          </div>
        ) : versions.map((v) => {
          const snap = v.snapshot || {};
          return (
            <div key={v.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid #f1f5f9", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                  {snap.name || "Sem nome"}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                  <Clock size={11} />
                  {new Date(v.createdAt).toLocaleString()}
                  <span>•</span>
                  Etapa {((snap.currentStep || 0) + 1)}/6
                </div>
              </div>
              <Chip size="small" label={snap.status || "draft"} />
              <Tooltip title="Restaurar">
                <IconButton size="small" style={{ background: "#ccfbf1", color: "#0f766e" }}
                  onClick={() => handleRestore(v.id)}>
                  <RotateCcw size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton size="small" style={{ background: "#fef2f2", color: "#ef4444" }}
                  onClick={() => handleDelete(v.id)}>
                  <Trash2 size={14} />
                </IconButton>
              </Tooltip>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetaTemplateVersionsDialog;
