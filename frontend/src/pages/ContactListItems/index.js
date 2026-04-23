import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
} from "react";

import { toast } from "react-toastify";
import { useParams, useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import BlockIcon from "@material-ui/icons/Block";
import ViewColumnIcon from "@material-ui/icons/ViewColumn";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from "@material-ui/core/Checkbox";
import ListItemText from "@material-ui/core/ListItemText";
import Tooltip from "@material-ui/core/Tooltip";
import Chip from "@material-ui/core/Chip";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactListItemModal from "../../components/ContactListItemModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import useContactLists from "../../hooks/useContactLists";
import { Grid } from "@material-ui/core";

import planilhaExemplo from "../../assets/planilha.xlsx";
import ForbiddenPage from "../../components/ForbiddenPage";
// import { SocketContext } from "../../context/Socket/SocketContext";


const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

// Definição das colunas opcionais (toggle)
const OPTIONAL_COLUMNS = [
  { key: "email", label: "E-mail", default: true },
  { key: "tags", label: "Tags", default: false },
  { key: "status", label: "Status", default: false },
  { key: "lastMessage", label: "Última mensagem", default: false },
  { key: "createdAt", label: "Criado em", default: false },
  { key: "company", label: "Empresa", default: false },
  { key: "country", label: "País / DDD", default: false },
  { key: "owner", label: "Responsável", default: false },
  { key: "source", label: "Origem", default: false },
];

const STORAGE_KEY = "contactListItems:visibleColumns";

const loadVisibleColumns = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) {}
  return OPTIONAL_COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: c.default }), {});
};

// Heurísticas para extrair dados que podem estar no contato ou em extraInfo
const getExtra = (contact, names) => {
  const list = contact?.extraInfo || contact?.contactExtraInfos || [];
  const arr = Array.isArray(list) ? list : [];
  for (const n of names) {
    const found = arr.find(
      (e) => (e?.name || "").toString().toLowerCase() === n.toLowerCase()
    );
    if (found && (found.value ?? "").toString().trim()) return found.value;
  }
  return "";
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (_) {
    return "-";
  }
};

const formatRelative = (value) => {
  if (!value) return "-";
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d`;
    return formatDate(value);
  } catch (_) {
    return "-";
  }
};

const getCountryFromNumber = (number) => {
  if (!number) return "-";
  const clean = number.toString().replace(/\D/g, "");
  if (!clean) return "-";
  const prefixes = {
    55: "🇧🇷 Brasil",
    1: "🇺🇸 EUA/CA",
    351: "🇵🇹 Portugal",
    34: "🇪🇸 Espanha",
    44: "🇬🇧 Reino Unido",
    49: "🇩🇪 Alemanha",
    33: "🇫🇷 França",
    39: "🇮🇹 Itália",
    52: "🇲🇽 México",
    54: "🇦🇷 Argentina",
    56: "🇨🇱 Chile",
    57: "🇨🇴 Colômbia",
    91: "🇮🇳 Índia",
  };
  for (const [code, label] of Object.entries(prefixes).sort((a, b) => b[0].length - a[0].length)) {
    if (clean.startsWith(code)) {
      const ddd = clean.slice(code.length, code.length + 2);
      return `${label} (${ddd})`;
    }
  }
  return `+${clean.slice(0, 3)}`;
};

const getStatusChip = (contact) => {
  if (contact?.isBlocked || contact?.blocked) {
    return { label: "Bloqueado", color: "#fee2e2", text: "#b91c1c" };
  }
  if (contact?.optOut || contact?.unsubscribed) {
    return { label: "Opt-out", color: "#fef3c7", text: "#92400e" };
  }
  if (contact?.isWhatsappValid === false) {
    return { label: "Inválido", color: "#e5e7eb", text: "#374151" };
  }
  return { label: "Ativo", color: "#d1fae5", text: "#065f46" };
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    overflowX: "auto",
    ...theme.scrollbarStyles,
  },
  columnsBtn: {
    marginLeft: theme.spacing(1),
  },
  tagChip: {
    margin: 2,
    height: 22,
    fontSize: 11,
  },
  statusChip: {
    height: 22,
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 11,
    padding: "0 8px",
    display: "inline-block",
    lineHeight: "22px",
  },
  truncate: {
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
    verticalAlign: "middle",
  },
}));

const ContactListItems = () => {
  const classes = useStyles();

  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  const { contactListId } = useParams();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactListItemModalOpen, setContactListItemModalOpen] =
    useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [contactList, setContactList] = useState({});
  const fileUploadRef = useRef(null);

  // Toggle de colunas opcionais (persistido em localStorage)
  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [columnsMenuAnchor, setColumnsMenuAnchor] = useState(null);

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const visibleOptionalCount = OPTIONAL_COLUMNS.filter((c) => visibleColumns[c.key]).length;
  const totalColumnCount = 4 + visibleOptionalCount; // # + Nome + Número + Ações + opcionais visíveis

  const { findById: findContactList } = useContactLists();

  useEffect(() => {
    findContactList(contactListId).then((data) => {
      setContactList(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactListId]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get(`contact-list-items`, {
            params: { searchParam, pageNumber, contactListId },
          });
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, contactListId]);

  useEffect(() => {
    const companyId = user.companyId;
    // const socket = socketManager.GetSocket();

    const onCompanyContactLists = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.record });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.id });
      }

      if (data.action === "reload") {
        dispatch({ type: "LOAD_CONTACTS", payload: data.records });
      }
    }
    socket.on(`company-${companyId}-ContactListItem`, onCompanyContactLists);

    return () => {
      socket.off(`company-${companyId}-ContactListItem`, onCompanyContactLists);
    };
  }, [contactListId]);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactListItemModal = () => {
    setSelectedContactId(null);
    setContactListItemModalOpen(true);
  };

  const handleCloseContactListItemModal = () => {
    setSelectedContactId(null);
    setContactListItemModalOpen(false);
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactListItemModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contact-list-items/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleImportContacts = async () => {
    try {
      const formData = new FormData();
      formData.append("file", fileUploadRef.current.files[0]);
      await api.request({
        url: `contact-lists/${contactListId}/upload`,
        method: "POST",
        data: formData,
      });
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const goToContactLists = () => {
    history.push("/contact-lists");
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <ContactListItemModal
        open={contactListItemModalOpen}
        onClose={handleCloseContactListItemModal}
        aria-labelledby="form-dialog-title"
        contactId={selectedContactId}
      ></ContactListItemModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contactListItems.confirmationModal.deleteTitle")} ${deletingContact.name
            }?`
            : `${i18n.t("contactListItems.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={() =>
          deletingContact
            ? handleDeleteContact(deletingContact.id)
            : handleImportContacts()
        }
      >
        {deletingContact ? (
          `${i18n.t("contactListItems.confirmationModal.deleteMessage")}`
        ) : (
          <>
            {i18n.t("contactListItems.confirmationModal.importMessage")}
            <a href={planilhaExemplo} download="planilha.xlsx">
              Clique aqui para baixar planilha exemplo.
            </a>
          </>
        )}
      </ConfirmationModal>
      {
        user.profile === "user" && user?.showCampaign === "disabled" ?
          <ForbiddenPage />
          :
          <>
            <MainHeader>
              <Grid style={{ width: "99.6%" }} container>
                <Grid xs={12} sm={5} item>
                  <Title>{contactList.name}</Title>
                </Grid>
                <Grid xs={12} sm={7} item>
                  <Grid spacing={2} container>
                    <Grid xs={12} sm={6} item>
                      <TextField
                        fullWidth
                        placeholder={i18n.t("contactListItems.searchPlaceholder")}
                        type="search"
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon style={{ color: "gray" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid xs={4} sm={2} item>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={goToContactLists}
                      >
                        {i18n.t("contactListItems.buttons.lists")}
                      </Button>
                    </Grid>
                    <Grid xs={4} sm={2} item>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          fileUploadRef.current.value = null;
                          fileUploadRef.current.click();
                        }}
                      >
                        {i18n.t("contactListItems.buttons.import")}
                      </Button>
                    </Grid>
                    <Grid xs={4} sm={2} item>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={handleOpenContactListItemModal}
                      >
                        {i18n.t("contactListItems.buttons.add")}
                      </Button>
                    </Grid>
                    <Grid xs={12} sm={12} item style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                      <Tooltip title="Mostrar/ocultar colunas">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewColumnIcon />}
                          onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
                          className={classes.columnsBtn}
                        >
                          Colunas ({visibleOptionalCount})
                        </Button>
                      </Tooltip>
                      <Menu
                        anchorEl={columnsMenuAnchor}
                        open={Boolean(columnsMenuAnchor)}
                        onClose={() => setColumnsMenuAnchor(null)}
                        keepMounted
                      >
                        {OPTIONAL_COLUMNS.map((col) => (
                          <MenuItem
                            key={col.key}
                            onClick={() => toggleColumn(col.key)}
                            dense
                          >
                            <Checkbox
                              checked={!!visibleColumns[col.key]}
                              size="small"
                              color="primary"
                            />
                            <ListItemText primary={col.label} />
                          </MenuItem>
                        ))}
                      </Menu>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </MainHeader>
            <Paper
              className={classes.mainPaper}
              variant="outlined"
              onScroll={handleScroll}
            >
              <>
                <input
                  style={{ display: "none" }}
                  id="upload"
                  name="file"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={() => {
                    setConfirmOpen(true);
                  }}
                  ref={fileUploadRef}
                />
              </>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" style={{ width: "0%" }}>
                      #
                    </TableCell>
                    <TableCell>{i18n.t("contactListItems.table.name")}</TableCell>
                    <TableCell align="center">
                      {i18n.t("contactListItems.table.number")}
                    </TableCell>
                    <TableCell align="center">
                      {i18n.t("contactListItems.table.email")}
                    </TableCell>
                    <TableCell align="center">
                      {i18n.t("contactListItems.table.actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell align="center" style={{ width: "0%" }}>
                          <IconButton>
                            {contact.isWhatsappValid ? (
                              <CheckCircleIcon
                                titleAccess="Whatsapp Válido"
                                htmlColor="green"
                              />
                            ) : (
                              <BlockIcon
                                titleAccess="Whatsapp Inválido"
                                htmlColor="grey"
                              />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>{contact.name}</TableCell>
                        <TableCell align="center">{contact.number}</TableCell>
                        <TableCell align="center">{contact.email}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => hadleEditContact(contact.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <Can
                            role={user.profile}
                            perform="contacts-page:deleteContact"
                            yes={() => (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setConfirmOpen(true);
                                  setDeletingContact(contact);
                                }}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {loading && <TableRowSkeleton columns={4} />}
                  </>
                </TableBody>
              </Table>
            </Paper>
          </>}
    </MainContainer>
  );
};

export default ContactListItems;
