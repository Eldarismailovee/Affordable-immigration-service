import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "immigration-intake";

const defaultState = {
  selectedPackage: "filing",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  caseType: "",
  notes: "",
  additionalI130Count: 0,
  expedited: false,
  consultationType: "Zoom",
  preferredDateTime: "",
  billingName: "",
  billingEmail: "",
  paymentPreference: "invoice",
  consentManualProcessing: false,
  paymentNotes: "",
  agreementPreview: null,
  submissionResult: null,
};

const IntakeContext = createContext(null);

export function IntakeProvider({ children }) {
  const [intake, setIntake] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
  }, [intake]);

  function updateField(name, value) {
    setIntake((prev) => ({ ...prev, [name]: value }));
  }

  function updateFields(values) {
    setIntake((prev) => ({ ...prev, ...values }));
  }

  function setAgreementPreview(preview) {
    setIntake((prev) => ({ ...prev, agreementPreview: preview }));
  }

  function setSubmissionResult(result) {
    setIntake((prev) => ({ ...prev, submissionResult: result }));
  }

  function resetIntake() {
    setIntake(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      intake,
      updateField,
      updateFields,
      setAgreementPreview,
      setSubmissionResult,
      resetIntake,
    }),
    [intake]
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

export function useIntake() {
  const context = useContext(IntakeContext);

  if (!context) {
    throw new Error("useIntake must be used inside IntakeProvider");
  }

  return context;
}
