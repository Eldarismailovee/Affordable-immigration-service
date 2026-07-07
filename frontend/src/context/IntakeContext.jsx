import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  deleteIntakeDraft,
  getIntakeDraft,
  saveIntakeDraft,
} from "../services/api.js";

const defaultState = {
  selectedPackage: "filing",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  caseType: "",
  petitionRelationship: "",
  location: "",
  hasUrgentDeadline: false,
  urgentDeadlineNotes: "",
  notes: "",
  additionalI130Count: 0,
  expedited: false,
  consultationType: "Zoom",
  preferredDateTime: "",
  billingName: "",
  billingEmail: "",
  paymentPreference: "invoice",
  consentManualProcessing: false,
  consentAvailabilityAcknowledgment: false,
  paymentNotes: "",
  agreementPreview: null,
  submissionResult: null,
};

const IntakeContext = createContext(null);

const AUTOSAVE_DEBOUNCE_MS = 1500;

function draftPayloadFromIntake(intake) {
  const { agreementPreview: _preview, submissionResult: _result, ...draft } = intake;
  return draft;
}

export function IntakeProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [intake, setIntake] = useState(defaultState);
  const [draftVersion, setDraftVersion] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [draftLoaded, setDraftLoaded] = useState(false);

  const userIdRef = useRef(null);
  const saveTimerRef = useRef(null);
  const draftVersionRef = useRef(null);
  const skipNextAutosaveRef = useRef(true);
  const intakeRef = useRef(intake);

  useEffect(() => {
    intakeRef.current = intake;
  }, [intake]);

  useEffect(() => {
    draftVersionRef.current = draftVersion;
  }, [draftVersion]);

  const resetLocalState = useCallback(() => {
    setIntake(defaultState);
    setDraftVersion(null);
    draftVersionRef.current = null;
    setSaveStatus("idle");
    skipNextAutosaveRef.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDraftForUser() {
      if (!isAuthenticated || !user?.id) {
        if (userIdRef.current) {
          resetLocalState();
          userIdRef.current = null;
        }
        setDraftLoaded(true);
        return;
      }

      if (userIdRef.current && userIdRef.current !== user.id) {
        resetLocalState();
      }

      userIdRef.current = user.id;
      skipNextAutosaveRef.current = true;
      setDraftLoaded(false);

      try {
        const draft = await getIntakeDraft();
        if (cancelled) {
          return;
        }

        if (draft?.data) {
          setIntake({ ...defaultState, ...draft.data });
          setDraftVersion(draft.version ?? null);
          draftVersionRef.current = draft.version ?? null;
        }
      } catch {
        if (!cancelled) {
          setSaveStatus("error");
        }
      } finally {
        if (!cancelled) {
          setDraftLoaded(true);
          skipNextAutosaveRef.current = false;
        }
      }
    }

    loadDraftForUser();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, resetLocalState, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !draftLoaded) {
      return undefined;
    }

    if (skipNextAutosaveRef.current) {
      return undefined;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      setSaveStatus("saving");

      try {
        const result = await saveIntakeDraft({
          data: draftPayloadFromIntake(intakeRef.current),
          version: draftVersionRef.current,
        });

        setDraftVersion(result.version);
        draftVersionRef.current = result.version;
        setSaveStatus("saved");
      } catch (error) {
        if (error?.status === 409) {
          try {
            const latest = await getIntakeDraft();
            if (latest?.data) {
              setIntake({ ...defaultState, ...latest.data });
              setDraftVersion(latest.version ?? null);
              draftVersionRef.current = latest.version ?? null;
            }
            setSaveStatus("saved");
            return;
          } catch {
            setSaveStatus("error");
            return;
          }
        }

        setSaveStatus("error");
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [draftLoaded, intake, isAuthenticated]);

  const updateField = useCallback((name, value) => {
    setIntake((prev) => ({ ...prev, [name]: value }));
  }, []);

  const updateFields = useCallback((values) => {
    setIntake((prev) => ({ ...prev, ...values }));
  }, []);

  const setAgreementPreview = useCallback((preview) => {
    setIntake((prev) => ({ ...prev, agreementPreview: preview }));
  }, []);

  const setSubmissionResult = useCallback((result) => {
    setIntake((prev) => ({ ...prev, submissionResult: result }));
  }, []);

  const resetIntake = useCallback(async () => {
    resetLocalState();

    if (isAuthenticated) {
      await deleteIntakeDraft().catch(() => {});
    }
  }, [isAuthenticated, resetLocalState]);

  const value = useMemo(
    () => ({
      intake,
      updateField,
      updateFields,
      setAgreementPreview,
      setSubmissionResult,
      resetIntake,
      saveStatus,
      draftLoaded,
      isServerDraftEnabled: isAuthenticated,
    }),
    [
      intake,
      updateField,
      updateFields,
      setAgreementPreview,
      setSubmissionResult,
      resetIntake,
      saveStatus,
      draftLoaded,
      isAuthenticated,
    ]
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
