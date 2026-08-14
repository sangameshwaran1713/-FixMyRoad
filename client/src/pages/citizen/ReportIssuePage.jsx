import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Image as ImageIcon, ShieldCheck, Cpu, AlertTriangle, Sparkles, Building2, MapPin, Send, FileText, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { uploadRoadImage } from '../../services/uploadService';
import { analyzeRoadImageApi } from '../../services/aiService';
import { resolveMunicipalityApi } from '../../services/municipalityService';
import { createComplaintApi } from '../../services/complaintService';
import LocationPicker from '../../components/location/LocationPicker';
import BoundingBoxOverlay from '../../components/ai/BoundingBoxOverlay';

const ReportIssuePage = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  // Phase 6 AI State
  const [aiState, setAiState] = useState('idle'); // idle | analyzing | success | model_unavailable | error
  const [aiResult, setAiResult] = useState(null);

  // Phase 5 Location State
  const [locationState, setLocationState] = useState(null);

  // Phase 7 Municipality State
  const [municipalityState, setMunicipalityState] = useState(null);
  const [isResolvingMun, setIsResolvingMun] = useState(false);

  // Phase 8 Description & Submission State
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file) => {
    setErrorMessage('');
    setUploadResult(null);
    setUploadState('idle');
    setAiState('idle');
    setAiResult(null);
    setMunicipalityState(null);
    setSubmittedComplaint(null);

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Image size exceeds 10 MB limit. Please select a smaller file.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setUploadState('idle');
    setAiState('idle');
    setAiResult(null);
    setLocationState(null);
    setMunicipalityState(null);
    setSubmittedComplaint(null);
    setDescription('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or capture a road image first.');
      return;
    }

    try {
      setUploadState('uploading');
      setErrorMessage('');

      const response = await uploadRoadImage(selectedFile);

      if (response.success && response.data) {
        setUploadResult(response.data);
        setUploadState('success');
      } else {
        throw new Error(response.message || 'Image upload failed');
      }
    } catch (err) {
      setUploadState('error');
      setErrorMessage(err.message || 'Image upload failed. Please check backend connection.');
    }
  };

  // Phase 6 AI Analysis Handler
  const handleRunAiAnalysis = async () => {
    if (!uploadResult || !uploadResult.imageUrl) return;

    try {
      setAiState('analyzing');
      setErrorMessage('');

      const res = await analyzeRoadImageApi(uploadResult.imageUrl);

      if (res.modelLoaded === false) {
        setAiState('model_unavailable');
        setAiResult(res);
      } else {
        setAiResult(res);
        setAiState('success');
      }
    } catch (err) {
      setAiState('error');
      setErrorMessage(err.message || 'AI analysis service is temporarily unavailable.');
    }
  };

  // Phase 7 Automatic Municipality Resolution Handler
  const handleLocationConfirmed = async (locationData) => {
    setLocationState(locationData);
    setMunicipalityState(null);

    const lat = locationData?.coordinates?.latitude;
    const lon = locationData?.coordinates?.longitude;

    if (!lat || !lon) return;

    try {
      setIsResolvingMun(true);
      const res = await resolveMunicipalityApi(lat, lon);

      if (res.success && res.data) {
        setMunicipalityState({
          status: 'success',
          data: res.data,
        });
      } else {
        setMunicipalityState({
          status: res.code === 'AMBIGUOUS_MUNICIPALITY' ? 'ambiguous' : 'not_found',
          message: res.message || 'No municipality found for this location',
          candidates: res.candidates || [],
        });
      }
    } catch (err) {
      setMunicipalityState({
        status: 'error',
        message: err.message || 'Failed to resolve responsible municipality.',
      });
    } finally {
      setIsResolvingMun(false);
    }
  };

  // Phase 8 Final Complaint Submission Handler
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();

    if (!uploadResult || !uploadResult.imageUrl) {
      setErrorMessage('Please upload a road damage photo.');
      return;
    }

    if (!locationState || !locationState.confirmed) {
      setErrorMessage('Please confirm defect location on the map.');
      return;
    }

    if (!municipalityState || municipalityState.status !== 'success') {
      setErrorMessage('A valid municipal authority must be resolved before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const payload = {
        imageUrl: uploadResult.imageUrl,
        description: description.trim(),
        location: {
          latitude: locationState.coordinates.latitude,
          longitude: locationState.coordinates.longitude,
          accuracy: locationState.coordinates.accuracy,
          source: locationState.source || 'GPS',
        },
      };

      const response = await createComplaintApi(payload);

      if (response.success && response.data?.complaint) {
        setSubmittedComplaint(response.data.complaint);
      } else {
        throw new Error(response.message || 'Complaint submission failed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  // SUCCESS SUBMISSION VIEW
  if (submittedComplaint) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 bg-emerald-950/10 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">Submission Confirmed</span>
            <h1 className="text-2xl font-black text-white mt-1">Complaint Created Successfully</h1>
            <p className="text-xs text-slate-400 mt-1">Your report has been assigned to the local authority for processing.</p>
          </div>

          {/* Generated Complaint ID Display */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Official Complaint ID</span>
            <div className="text-2xl font-mono font-black text-cyan-400 tracking-wider">
              {submittedComplaint.complaintId}
            </div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mt-1">
              STATUS: {submittedComplaint.status}
            </div>
          </div>

          {/* Summary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Primary Issue & Severity</span>
              <p className="text-white font-bold">{submittedComplaint.issueType}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(submittedComplaint.severity)}`}>
                {submittedComplaint.severity}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Responsible Authority</span>
              <p className="text-emerald-400 font-bold">
                {submittedComplaint.municipalityId?.name || 'Local Authority'}
              </p>
              <p className="text-slate-400">Code: {submittedComplaint.municipalityId?.code || 'MUN'}</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/citizen/complaints/${submittedComplaint.complaintId}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Complaint Details</span>
            </Link>

            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-full sm:w-auto px-6 py-3 rounded-xl glass-panel text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Report Another Defect</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      {/* Header Breadcrumb */}
      <div>
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Citizen Dashboard</span>
        </Link>
      </div>

      {/* STEP 1: ROAD DAMAGE PHOTO UPLOAD */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
            1
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Road Damage Photo</h1>
            <p className="text-xs text-slate-400">Step 1: Capture or select a clear image of the road defect</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {!previewUrl ? (
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 text-center bg-slate-900/40 transition-colors">
            <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-300 mb-1">Select or snap a photo of damaged road</p>
            <p className="text-xs text-slate-500 mb-6">Supports JPG, PNG, WEBP (Max 10 MB)</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-take-photo"
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-semibold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>

              <button
                id="btn-choose-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {aiResult && aiResult.detections && aiResult.detections.length > 0 ? (
              <BoundingBoxOverlay
                imageUrl={uploadResult?.imageUrl || previewUrl}
                detections={aiResult.detections}
                originalWidth={uploadResult?.width || 1920}
                originalHeight={uploadResult?.height || 1080}
              />
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-xl max-h-96 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Selected road defect preview"
                  className="max-h-96 w-auto object-contain rounded-2xl"
                />
                <button
                  id="btn-remove-preview"
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploadState === 'uploading'}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  title="Remove Image"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}

            {uploadState !== 'success' && (
              <button
                id="btn-upload-image"
                type="button"
                onClick={handleUpload}
                disabled={uploadState === 'uploading'}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-sm"
              >
                {uploadState === 'uploading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing & Uploading Image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {uploadState === 'success' && uploadResult && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-sm">Image Uploaded Successfully</h3>
                <p className="text-xs text-emerald-300">Stored on Cloudinary • Ready for AI Detection</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: AI ROAD DAMAGE DETECTION */}
      {uploadState === 'success' && uploadResult && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20">
                2
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Damage Analysis</h2>
                <p className="text-xs text-slate-400">Step 2: Ultralytics YOLO computer vision inference</p>
              </div>
            </div>

            {aiState !== 'success' && (
              <button
                id="btn-run-ai"
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={aiState === 'analyzing'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {aiState === 'analyzing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>
            )}
          </div>

          {aiState === 'model_unavailable' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>AI Road Damage Model Not Configured</span>
              </div>
              <p className="text-slate-300">
                {aiResult?.message || 'The road damage YOLO model is not configured. Place road_damage.pt in ai-service/models/ directory.'}
              </p>
            </div>
          )}

          {aiState === 'success' && aiResult && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Primary Detected Issue</span>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">
                      {aiResult.primaryIssue || 'No Damage Detected'}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Confidence</span>
                      <span className="text-sm font-bold text-cyan-400">
                        {Math.round((aiResult.overallConfidence || 0) * 100)}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Estimated Priority</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(aiResult.severity)}`}>
                        {aiResult.severity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: GPS LOCATION & INTERACTIVE MAP */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
            3
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Geographic Location</h2>
            <p className="text-xs text-slate-400">Step 3: Detect GPS position or select manually on map</p>
          </div>
        </div>

        <LocationPicker onLocationConfirmed={handleLocationConfirmed} />
      </div>

      {/* STEP 4: AUTOMATIC MUNICIPALITY RESOLUTION RESULT */}
      {locationState && locationState.confirmed && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20">
              4
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Responsible Municipal Authority</h2>
              <p className="text-xs text-slate-400">Step 4: Automatic GeoJSON 2dsphere spatial boundary resolution</p>
            </div>
          </div>

          {isResolvingMun ? (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Querying MongoDB 2dsphere index for responsible municipal boundary...</span>
            </div>
          ) : municipalityState?.status === 'success' ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {municipalityState.data.municipality.name}
                    </h3>
                    <p className="text-xs text-emerald-300">
                      Code: {municipalityState.data.municipality.code} • District: {municipalityState.data.municipality.district}, {municipalityState.data.municipality.state}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-semibold">
                  {municipalityState.data.routingMethod}
                </span>
              </div>
            </div>
          ) : municipalityState?.status === 'not_found' ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-semibold text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Municipality Not Found</span>
              </div>
              <p className="text-slate-300">
                No active municipal boundary encompasses this location. Please verify or adjust your location pin on the map.
              </p>
            </div>
          ) : municipalityState?.status === 'ambiguous' ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-semibold text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Ambiguous Municipality Boundary</span>
              </div>
              <p className="text-slate-300">
                This location falls within multiple touching municipality boundaries. Please shift the marker slightly into the precise municipal ward.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* STEP 5: FINAL REVIEW & SUBMISSION FORM */}
      {uploadResult && locationState && locationState.confirmed && municipalityState?.status === 'success' && (
        <form onSubmit={handleSubmitComplaint} className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/40 bg-slate-900/60 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
              5
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Review & Submit Complaint</h2>
              <p className="text-xs text-slate-400">Step 5: Add optional description and submit to local authority</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Additional Description / Landmark Notes (Optional, max 1000 characters)
            </label>
            <textarea
              id="txt-complaint-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Large pothole located near the main entrance gate..."
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-all resize-none"
            />
            <span className="text-[11px] text-slate-500 text-right block">{description.length} / 1000 characters</span>
          </div>

          <button
            id="btn-submit-complaint"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Complaint & Generating FMR ID...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Official Complaint</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportIssuePage;
