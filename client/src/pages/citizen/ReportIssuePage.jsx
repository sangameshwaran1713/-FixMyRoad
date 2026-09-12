import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Image as ImageIcon, ShieldCheck, Cpu, AlertTriangle, Sparkles, Building2, MapPin, Send, FileText, Lightbulb, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { uploadRoadImage } from '../../services/uploadService';
import { analyzeRoadImageApi } from '../../services/aiService';
import { resolveMunicipalityApi } from '../../services/municipalityService';
import { createComplaintApi } from '../../services/complaintService';
import LocationPicker from '../../components/location/LocationPicker';
import BoundingBoxOverlay from '../../components/ai/BoundingBoxOverlay';

const ReportIssuePage = () => {
  const navigate = useNavigate();

  const [issueCategory, setIssueCategory] = useState('ROAD'); // 'ROAD' | 'STREET_LIGHT'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  // Category Verification State
  const [categoryVerification, setCategoryVerification] = useState(null); // { valid: boolean, detectedType: string, message: string }

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
    setCategoryVerification(null);
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

    // Initial heuristic filename/meta category check
    const fileNameLower = file.name.toLowerCase();
    if (fileNameLower.includes('light') || fileNameLower.includes('lamp') || fileNameLower.includes('pole')) {
      setIssueCategory('STREET_LIGHT');
      setCategoryVerification({
        valid: true,
        detectedType: 'STREET_LIGHT',
        message: 'Streetlight image category detected from file.'
      });
    } else {
      setCategoryVerification({
        valid: true,
        detectedType: issueCategory,
        message: `Image selected for ${issueCategory === 'STREET_LIGHT' ? 'Street Light' : 'Road Damage'} inspection.`
      });
    }
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
    setCategoryVerification(null);
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
      setErrorMessage('Please select or capture an image of road damage or street light first.');
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

  // Phase 6 AI Analysis Handler with Road vs Streetlight Category Verification
  const handleRunAiAnalysis = async () => {
    if (!uploadResult || !uploadResult.imageUrl) return;

    try {
      setAiState('analyzing');
      setErrorMessage('');

      const res = await analyzeRoadImageApi(uploadResult.imageUrl);

      if (res.modelLoaded === false) {
        setAiState('model_unavailable');
        setAiResult(res);
        setCategoryVerification({
          valid: true,
          detectedType: issueCategory,
          message: 'AI Model offline. Category set manually by citizen.'
        });
      } else {
        setAiResult(res);
        setAiState('success');

        const primaryIssue = res.primaryIssue;
        const isStreetLight = primaryIssue === 'DAMAGED_STREET_LIGHT' || issueCategory === 'STREET_LIGHT';
        const isRoadDefect = ['POTHOLE', 'ROAD_CRACK', 'BROKEN_ROAD', 'WATERLOGGING', 'OPEN_MANHOLE', 'DAMAGED_DIVIDER', 'MISSING_ROAD_SIGN'].includes(primaryIssue) || issueCategory === 'ROAD';

        if (isStreetLight) {
          setIssueCategory('STREET_LIGHT');
          setCategoryVerification({
            valid: true,
            detectedType: 'STREET_LIGHT',
            message: '✓ Verified: Image categorized as Street Light Infrastructure.'
          });
        } else if (isRoadDefect) {
          setCategoryVerification({
            valid: true,
            detectedType: 'ROAD',
            message: '✓ Verified: Image categorized as Road Surface Defect.'
          });
        } else if (res.detections && res.detections.length === 0) {
          setCategoryVerification({
            valid: true,
            detectedType: issueCategory,
            message: `Categorized as ${issueCategory === 'STREET_LIGHT' ? 'Street Light' : 'Road Damage'} (Standard Inspection).`
          });
        } else {
          setCategoryVerification({
            valid: false,
            detectedType: 'INVALID',
            message: '⚠️ Invalid Image Category: Uploaded photo does not appear to be a road defect or street light.'
          });
        }
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
      setErrorMessage('Please upload a road or streetlight damage photo.');
      return;
    }

    if (categoryVerification && !categoryVerification.valid) {
      setErrorMessage('Invalid image category. Image must depict road damage or a street light issue.');
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
        issueType: issueCategory === 'STREET_LIGHT' ? 'DAMAGED_STREET_LIGHT' : (aiResult?.primaryIssue || 'POTHOLE'),
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
        return 'bg-[#f4f3ef] text-rose-900 border-rose-300 font-bold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
      case 'MEDIUM':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      default:
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
    }
  };

  // SUCCESS SUBMISSION VIEW
  if (submittedComplaint) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="civic-panel p-8 border border-slate-200 bg-white space-y-6 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-800">Submission Confirmed</span>
            <h1 className="font-heading text-2xl font-bold text-slate-900 mt-1 uppercase">Complaint Created Successfully</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Your issue report has been logged with the municipal authority.</p>
          </div>

          {/* Generated Complaint ID Display */}
          <div className="p-5 border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Official Complaint ID</span>
            <div className="text-2xl font-mono font-bold text-slate-900 tracking-wider">
              {submittedComplaint.complaintId}
            </div>
            <div className="inline-block px-3 py-1 text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
              STATUS: {submittedComplaint.status}
            </div>
          </div>

          {/* Summary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
            <div className="p-4 border border-slate-200 bg-white space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Primary Category & Severity</span>
              <p className="text-slate-900 font-bold">{submittedComplaint.issueType}</p>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(submittedComplaint.severity)}`}>
                {submittedComplaint.severity}
              </span>
            </div>

            <div className="p-4 border border-slate-200 bg-white space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Responsible Authority</span>
              <p className="text-slate-900 font-bold">
                {submittedComplaint.municipalityId?.name || 'Local Authority'}
              </p>
              <p className="text-slate-500">Code: {submittedComplaint.municipalityId?.code || 'MUN'}</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/citizen/complaints/${submittedComplaint.complaintId}`}
              className="w-full sm:w-auto civic-btn civic-btn-primary py-3 px-6 text-xs flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4 mr-1" />
              <span>VIEW COMPLAINT DETAILS</span>
            </Link>

            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-full sm:w-auto civic-btn civic-btn-outline py-3 px-6 text-xs"
            >
              <span>REPORT ANOTHER ISSUE</span>
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
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Citizen Dashboard</span>
        </Link>
      </div>

      {/* STEP 1: CATEGORY & PHOTO UPLOAD */}
      <div className="civic-panel p-6 sm:p-8 border border-slate-200 bg-white space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">
              Step 1: Issue Category & Photo Upload
            </h2>
            <p className="text-xs text-slate-500">Select infrastructure type and upload a clear photo</p>
          </div>
        </div>

        {/* CATEGORY SWITCHER */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setIssueCategory('ROAD')}
            className={`p-3.5 border text-left transition-all cursor-pointer rounded-lg flex items-center space-x-3 ${
              issueCategory === 'ROAD'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
            }`}
          >
            <div className={`p-2 rounded-md ${issueCategory === 'ROAD' ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Road Surface Defect</p>
              <p className={`text-[10px] mt-0.5 ${issueCategory === 'ROAD' ? 'text-slate-300' : 'text-slate-500'}`}>
                Potholes, Cracks, Manholes
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIssueCategory('STREET_LIGHT')}
            className={`p-3.5 border text-left transition-all cursor-pointer rounded-lg flex items-center space-x-3 ${
              issueCategory === 'STREET_LIGHT'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
            }`}
          >
            <div className={`p-2 rounded-md ${issueCategory === 'STREET_LIGHT' ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Street Light Issue</p>
              <p className={`text-[10px] mt-0.5 ${issueCategory === 'STREET_LIGHT' ? 'text-slate-300' : 'text-slate-500'}`}>
                Broken Lamp, Dark Light
              </p>
            </div>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
          <div className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-8 text-center bg-slate-50 transition-colors">
            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select or snap a photo of {issueCategory === 'STREET_LIGHT' ? 'street light' : 'road damage'}
            </p>
            <p className="text-[11px] text-slate-500 mb-5">Supports JPG, PNG, WEBP (Max 10 MB)</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-take-photo"
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto civic-btn civic-btn-primary py-2.5 px-4 text-xs flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4 mr-1" />
                <span>Take Photo</span>
              </button>

              <button
                id="btn-choose-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto civic-btn civic-btn-outline py-2.5 px-4 text-xs flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4 mr-1" />
                <span>Choose File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {aiResult && aiResult.detections && aiResult.detections.length > 0 ? (
              <BoundingBoxOverlay
                imageUrl={uploadResult?.imageUrl || previewUrl}
                detections={aiResult.detections}
                originalWidth={uploadResult?.width || 1920}
                originalHeight={uploadResult?.height || 1080}
              />
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 max-h-96 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Selected infrastructure preview"
                  className="max-h-96 w-auto object-contain rounded-xl"
                />
                <button
                  id="btn-remove-preview"
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploadState === 'uploading'}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/80 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border border-slate-700"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Category Verification Status Indicator */}
            {categoryVerification && (
              <div className={`p-3.5 border rounded-lg text-xs flex items-center space-x-2.5 ${
                categoryVerification.valid 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {categoryVerification.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                )}
                <span className="font-semibold">{categoryVerification.message}</span>
              </div>
            )}

            {uploadState !== 'success' && (
              <button
                id="btn-upload-image"
                type="button"
                onClick={handleUpload}
                disabled={uploadState === 'uploading'}
                className="w-full civic-btn civic-btn-primary py-3 text-xs flex items-center justify-center space-x-2"
              >
                {uploadState === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Processing & Uploading Image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    <span>Upload & Verify Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {uploadState === 'success' && uploadResult && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">Image Uploaded & Verified</span>
                <p className="text-[11px] text-emerald-700 font-normal">Ready for AI Detection & Location Resolution</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
              {issueCategory}
            </span>
          </div>
        )}
      </div>

      {/* STEP 2: DEFECT GPS LOCATION */}
      <div className="civic-panel p-6 sm:p-8 border border-slate-200 bg-white space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Step 2: Defect GPS Location</h2>
            <p className="text-xs text-slate-500">Confirm geographic coordinates for municipal dispatch</p>
          </div>
        </div>

        <LocationPicker onLocationConfirmed={handleLocationConfirmed} />
      </div>

      {/* STEP 3: AI DAMAGE & INFRASTRUCTURE ANALYSIS */}
      {uploadState === 'success' && uploadResult && (
        <div className="civic-panel p-6 sm:p-8 border border-slate-200 bg-white space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Step 3: AI Infrastructure Analysis</h2>
                <p className="text-xs text-slate-500">Automated computer vision inspection & category verification</p>
              </div>
            </div>

            {aiState !== 'success' && (
              <button
                id="btn-run-ai"
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={aiState === 'analyzing'}
                className="civic-btn civic-btn-primary py-2.5 px-4 text-xs flex items-center space-x-1.5"
              >
                {aiState === 'analyzing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>
            )}
          </div>

          {aiState === 'model_unavailable' && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> AI Model Offline
              </span>
              <p className="text-amber-800">
                {aiResult?.message || 'YOLO model unavailable. Default category applied.'}
              </p>
            </div>
          )}

          {aiState === 'success' && aiResult && (
            <div className="p-4 border border-slate-200 bg-slate-50 space-y-3 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Detected Issue Type</span>
                  <h3 className="font-heading text-base font-bold text-slate-900 mt-0.5">
                    {aiResult.primaryIssue || (issueCategory === 'STREET_LIGHT' ? 'DAMAGED_STREET_LIGHT' : 'ROAD_DEFECT')}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">AI Confidence</span>
                    <span className="text-xs font-bold text-slate-900">
                      {Math.round((aiResult.overallConfidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Priority</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(aiResult.severity)}`}>
                      {aiResult.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: MUNICIPALITY BOUNDARY RESOLUTION */}
      {locationState && locationState.confirmed && (
        <div className="civic-panel p-6 sm:p-8 border border-slate-200 bg-white space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Step 4: Responsible Municipal Authority</h2>
              <p className="text-xs text-slate-500">Automatic spatial ward boundary lookup</p>
            </div>
          </div>

          {isResolvingMun ? (
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              <span>Querying MongoDB 2dsphere index for responsible municipal ward...</span>
            </div>
          ) : municipalityState?.status === 'success' ? (
            <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-900 space-y-2 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-800 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {municipalityState.data.municipality.name}
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Code: {municipalityState.data.municipality.code} • District: {municipalityState.data.municipality.district}, {municipalityState.data.municipality.state}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {municipalityState.data.routingMethod}
                </span>
              </div>
            </div>
          ) : municipalityState?.status === 'not_found' ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <span className="font-bold">Municipality Not Found</span>
              <p>No active municipal boundary encompasses this location. Please adjust your location pin.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* STEP 5: FINAL COMPLAINT SUBMISSION */}
      {uploadResult && locationState && locationState.confirmed && municipalityState?.status === 'success' && (
        <form onSubmit={handleSubmitComplaint} className="civic-panel p-6 sm:p-8 border border-slate-900 bg-white space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Step 5: Review & Submit Official Complaint</h2>
              <p className="text-xs text-slate-500">Provide notes and log official report</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Additional Notes / Landmark Description (Optional)
            </label>
            <textarea
              id="txt-complaint-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Near main junction gate or street pole #42..."
              maxLength={1000}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 text-slate-900 placeholder-slate-400 text-xs outline-none transition-all resize-none"
            />
          </div>

          <button
            id="btn-submit-complaint"
            type="submit"
            disabled={isSubmitting}
            className="w-full civic-btn civic-btn-primary py-4 text-xs font-bold tracking-widest disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Submitting Complaint & Generating FMR ID...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                <span>Submit Official Complaint ({issueCategory === 'STREET_LIGHT' ? 'Street Light' : 'Road Damage'})</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportIssuePage;
