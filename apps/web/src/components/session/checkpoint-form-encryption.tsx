import React from 'react';

/**
 * Encryption checkbox component
 * @param {object} props - Component props
 * @param {boolean} props.encryptData - Whether encryption is enabled
 * @param {(value: boolean) => void} props.onEncryptDataChange - Encrypt data change handler
 * @returns {React.ReactElement} Encryption checkbox JSX element
 */
function EncryptionCheckbox({
  encryptData,
  onEncryptDataChange
}: {
  encryptData: boolean;
  onEncryptDataChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id="encrypt-data"
        checked={encryptData}
        onChange={e => onEncryptDataChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor="encrypt-data" className="ml-2 block text-sm text-gray-700">
        Encrypt checkpoint data
      </label>
    </div>
  );
}

/**
 * Encryption description component
 * @returns {React.ReactElement} Encryption description JSX element
 */
function EncryptionDescription(): React.ReactElement {
  return (
    <p className="mt-1 text-xs text-gray-500">
      Adds an extra layer of security for sensitive workspace data
    </p>
  );
}

/**
 * Encryption key input component
 * @param {object} props - Component props
 * @param {string} props.encryptionKey - Encryption key value
 * @param {(value: string) => void} props.onEncryptionKeyChange - Encryption key change handler
 * @returns {React.ReactElement} Encryption key input JSX element
 */
function EncryptionKeyInput({
  encryptionKey,
  onEncryptionKeyChange
}: {
  encryptionKey: string;
  onEncryptionKeyChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="mt-3">
      <label htmlFor="encryption-key" className="block text-sm font-medium text-gray-700 mb-1">
        Encryption Key
      </label>
      <input
        type="password"
        id="encryption-key"
        value={encryptionKey}
        onChange={e => onEncryptionKeyChange(e.target.value)}
        placeholder="Enter encryption key"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
      <p className="mt-1 text-xs text-gray-500">
        Store this key securely - you'll need it to restore this checkpoint
      </p>
    </div>
  );
}

/**
 * Encryption field component
 * @param {object} props - Component props
 * @param {boolean} props.encryptData - Whether encryption is enabled
 * @param {(value: boolean) => void} props.onEncryptDataChange - Encrypt data change handler
 * @param {string} props.encryptionKey - Encryption key value
 * @param {(value: string) => void} props.onEncryptionKeyChange - Encryption key change handler
 * @returns {React.ReactElement} Encryption field JSX element
 */
function EncryptionField({
  encryptData,
  onEncryptDataChange,
  encryptionKey,
  onEncryptionKeyChange
}: {
  encryptData: boolean;
  onEncryptDataChange: (value: boolean) => void;
  encryptionKey: string;
  onEncryptionKeyChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div>
      <EncryptionCheckbox encryptData={encryptData} onEncryptDataChange={onEncryptDataChange} />
      <EncryptionDescription />

      {encryptData && (
        <EncryptionKeyInput
          encryptionKey={encryptionKey}
          onEncryptionKeyChange={onEncryptionKeyChange}
        />
      )}
    </div>
  );
}

export { EncryptionCheckbox, EncryptionDescription, EncryptionField, EncryptionKeyInput };
