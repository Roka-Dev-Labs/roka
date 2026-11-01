import { useEffect, useState } from "react";
import { accessToken, apiBase, redirectToLogin } from "../api.js";
import { Nav } from "../components/Nav.jsx";

export function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState("");

  useEffect(() => {
    const token = accessToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    let cancelled = false;

    async function loadApiKeys() {
      try {
        const response = await fetch(`${apiBase()}/api-keys`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          redirectToLogin();
          return;
        }
        const body = await response.json();
        if (!cancelled) setKeys(Array.isArray(body) ? body : []);
      } catch {
        if (!cancelled) setKeys([]);
      }
    }

    loadApiKeys();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createApiKey(name) {
    const token = accessToken();
    try {
      const response = await fetch(`${apiBase()}/api-keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to create API key");
      const key = await response.json();
      setCreatedKey(key.key);
    } catch {
      alert("Failed to create API key. Please try again.");
      return;
    }
    await reloadKeys(token);
  }

  async function deleteKey(keyId) {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    const token = accessToken();
    try {
      const response = await fetch(`${apiBase()}/api-keys/${encodeURIComponent(keyId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete API key");
    } catch {
      alert("Failed to delete API key. Please try again.");
      return;
    }
    await reloadKeys(token);
  }

  async function reloadKeys(token) {
    try {
      const list = await fetch(`${apiBase()}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!list.ok) {
        redirectToLogin();
        return;
      }
      const body = await list.json();
      setKeys(Array.isArray(body) ? body : []);
    } catch {
      /* original list reload ignores thrown errors */
    }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => {
      alert("API key copied to clipboard");
    });
  }

  function closeModal() {
    setModalOpen(false);
    setKeyName("");
    setCreatedKey("");
  }

  function handleCreateKey() {
    const name = keyName.trim();
    if (!name) {
      alert("Please enter a key name");
      return;
    }
    createApiKey(name);
  }

  return (
    <>
      <Nav active="keys" />
      <div className="container">
        <div className="page-header">
          <h1>API Keys</h1>
          <button className="btn-primary" type="button" onClick={() => setModalOpen(true)}>
            Generate New Key
          </button>
        </div>
        <div className="api-keys-list">
          {keys.length === 0 ? (
            <div className="empty-state">
              <h3>No API keys yet</h3>
              <p>Generate your first API key to start using Roka</p>
            </div>
          ) : (
            keys.map((key) => (
              <div className="api-key-card" key={key.id}>
                <div className="api-key-header">
                  <div className="api-key-name">{key.name}</div>
                  <div className="api-key-actions">
                    <button className="btn-small" type="button" onClick={() => copyKey(key.key)}>
                      Copy
                    </button>
                    <button className="btn-small danger" type="button" onClick={() => deleteKey(key.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="api-key-value">{key.key}</div>
                <div className="api-key-meta">
                  <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                  <span>
                    Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={modalOpen ? "modal open" : "modal"}>
        <div className="modal-content">
          {createdKey ? (
            <>
              <div className="modal-header">API Key Generated</div>
              <div className="new-key-display">
                <code>{createdKey}</code>
                <p>
                  <strong>Save this key now!</strong> You won&apos;t be able to see it again.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" type="button" onClick={() => copyKey(createdKey)}>
                  Copy Key
                </button>
                <button className="btn-secondary" type="button" onClick={closeModal}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="modal-header">Generate New API Key</div>
              <div className="form-group">
                <label htmlFor="keyName">Key Name</label>
                <input
                  id="keyName"
                  type="text"
                  placeholder="e.g., Production, Development"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn-primary" type="button" onClick={handleCreateKey}>
                  Generate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
