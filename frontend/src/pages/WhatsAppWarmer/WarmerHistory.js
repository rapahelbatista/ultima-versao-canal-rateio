import React, { useEffect, useState, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, IconButton, Tooltip, Chip, TextField } from "@material-ui/core";
import { Save, RotateCcw, Trash2, Clock, Bookmark, History } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import SectionCard from "../../components/SectionCard";

const useStyles = makeStyles((theme) => ({
  hint: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", background: "#eff6ff", border: "1px solid #dbeafe",
    borderRadius: 12, color: "#1e40af", fontSize: 13, marginBottom: 12,
  },
  saveRow: {
    display: "flex", gap: 8, alignItems: "center",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: 10, marginBottom: 12,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto auto",
    gap: 10, alignItems: "center",
    background: "#fff", border: "1px solid #f1f5f9",
    borderRadius: 12, padding: "10px 14px", marginBottom: 8,
    "&:hover": { borderColor: "#a7f3d0" },
  },
  name: { fontSize: 13, fontWeight: 700, color: "#1e293b" },
  meta: { fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", gap: 6, alignItems: "center" },
  loadBtn: {
    color: "#0f766e", background: "#ccfbf1",
    "&:hover": { background: "#99f6e4" },
  },
  delBtn: {
    color: "#ef4444", background: "#fef2f2",
    "&:hover": { background: "#fee2e2" },
  },
  empty: { padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: "#1e293b",
    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
  },
}));

const WarmerHistory = ({ messages, config, onLoadDraft }) => {
  const classes = useStyles();
  const [drafts, setDrafts] = useState([]);
  const [versions, setVersions] = useState([]);
  const [draftName, setDraftName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [d, v] = await Promise.all([
        api.get("/warmer-drafts"),
        api.get("/warmer-versions"),
      ]);
      setDrafts(Array.isArray(d.data) ? d.data : []);
      setVersions(Array.isArray(v.data) ? v.data : []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveDraft = async () => {
    const name = draftName.trim() || `Rascunho ${new Date().toLocaleString()}`;
    try {
      await api.post("/warmer-drafts", { name, messages, config });
      setDraftName("");
      toast.success("Rascunho salvo");
      fetchAll();
    } catch (err) { toastError(err); }
  };

  const deleteDraft = async (id) => {
    if (!window.confirm("Excluir este rascunho?")) return;
    try {
      await api.delete(`/warmer-drafts/${id}`);
      setDrafts((arr) => arr.filter((d) => d.id !== id));
    } catch (err) { toastError(err); }
  };

  const deleteVersion = async (id) => {
    try {
      await api.delete(`/warmer-versions/${id}`);
      setVersions((arr) => arr.filter((v) => v.id !== id));
    } catch (err) { toastError(err); }
  };

  return (
    <div>
      <div className={classes.hint}>
        <Bookmark size={16} />
        Salve rascunhos nomeados do script atual e retome quando quiser. O
        sistema também guarda automaticamente snapshots a cada alteração.
      </div>

      <SectionCard>
        <div className={classes.sectionTitle}>
          <Bookmark size={14} /> Salvar rascunho atual
        </div>
        <div className={classes.saveRow}>
          <TextField
            placeholder="Nome do rascunho (opcional)"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            size="small" variant="outlined" fullWidth
          />
          <Button
            variant="contained" startIcon={<Save size={14} />}
            onClick={saveDraft}
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#fff", textTransform: "none", fontWeight: 700,
              borderRadius: 10, whiteSpace: "nowrap",
            }}
          >
            Salvar
          </Button>
        </div>
      </SectionCard>

      <SectionCard>
        <div className={classes.sectionTitle}>
          <Bookmark size={14} /> Rascunhos salvos
        </div>
        {loading ? (
          <div className={classes.empty}>Carregando…</div>
        ) : drafts.length === 0 ? (
          <div className={classes.empty}>Nenhum rascunho ainda.</div>
        ) : drafts.map((d) => (
          <div key={d.id} className={classes.row}>
            <div>
              <div className={classes.name}>{d.name}</div>
              <div className={classes.meta}>
                <Clock size={11} />
                {new Date(d.updatedAt).toLocaleString()}
                <span>•</span>
                {(d.messages || []).length} mensagens
              </div>
            </div>
            <Chip size="small" label={`${(d.messages || []).length} msg`} />
            <Tooltip title="Carregar este rascunho">
              <IconButton size="small" className={classes.loadBtn}
                onClick={() => onLoadDraft({ messages: d.messages || [], config: d.config || {} })}>
                <RotateCcw size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" className={classes.delBtn} onClick={() => deleteDraft(d.id)}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </div>
        ))}
      </SectionCard>

      <SectionCard>
        <div className={classes.sectionTitle}>
          <History size={14} /> Histórico automático ({versions.length})
        </div>
        {versions.length === 0 ? (
          <div className={classes.empty}>Sem snapshots automáticos ainda.</div>
        ) : versions.map((v) => (
          <div key={v.id} className={classes.row}>
            <div>
              <div className={classes.name}>
                Snapshot #{v.id}
              </div>
              <div className={classes.meta}>
                <Clock size={11} />
                {new Date(v.createdAt).toLocaleString()}
                <span>•</span>
                {(v.messages || []).length} mensagens
              </div>
            </div>
            <Chip size="small" label="auto" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }} />
            <Tooltip title="Restaurar este snapshot">
              <IconButton size="small" className={classes.loadBtn}
                onClick={() => onLoadDraft({ messages: v.messages || [], config: v.config || {} })}>
                <RotateCcw size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" className={classes.delBtn} onClick={() => deleteVersion(v.id)}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </div>
        ))}
      </SectionCard>
    </div>
  );
};

export default WarmerHistory;
