import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  variant?: 'small' | 'medium' | 'large';
  message?: string;
  steps?: string[];
  currentStep?: string;
  progress?: number;
}

export default function LoadingSpinner({ 
  variant = 'medium', 
  message, 
  steps,
  currentStep,
  progress 
}: LoadingSpinnerProps) {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const containerSizes = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[variant]}`}>
      {/* Main Spinner */}
      <motion.div
        className={`${sizes[variant]} border-4 border-purple-900 border-t-purple-400 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-purple-200 text-center text-sm italic"
        >
          {message}
        </motion.p>
      )}

      {/* Current Step Indicator */}
      {currentStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 bg-purple-800 bg-opacity-40 p-3 rounded-lg text-center"
        >
          <p className="text-purple-200 text-sm">{currentStep}</p>
        </motion.div>
      )}

      {/* Progress Bar */}
      {typeof progress === 'number' && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.4 }}
          className="mt-4 w-full max-w-xs"
        >
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-purple-300 text-center mt-1">{Math.round(progress)}% complete</p>
        </motion.div>
      )}

      {/* Step List */}
      {steps && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 space-y-2 w-full max-w-xs"
        >
          {steps.map((step, index) => {
            const isActive = currentStep === step;
            const isCompleted = steps.indexOf(currentStep || '') > index;
            
            return (
              <motion.div
                key={index}
                className={`flex items-center space-x-2 p-2 rounded ${
                  isActive 
                    ? 'bg-purple-600 bg-opacity-30 border border-purple-500' 
                    : isCompleted 
                    ? 'bg-green-600 bg-opacity-20 border border-green-500'
                    : 'bg-gray-800 bg-opacity-30'
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  isActive 
                    ? 'bg-purple-400 animate-pulse' 
                    : isCompleted 
                    ? 'bg-green-400'
                    : 'bg-gray-500'
                }`} />
                <span className={`text-xs ${
                  isActive 
                    ? 'text-purple-200 font-medium' 
                    : isCompleted 
                    ? 'text-green-200'
                    : 'text-gray-400'
                }`}>
                  {step}
                </span>
                {isCompleted && <span className="text-green-400 text-xs">✓</span>}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// Specialized loading components for different use cases

export function ChartCalculationLoader({ currentStep }: { currentStep?: string }) {
  const steps = [
    "🌍 Finding birth location",
    "🪐 Calculating planetary positions", 
    "🏠 Determining house positions",
    "⭐ Analyzing aspects",
    "📊 Computing life area scores"
  ];

  const stepIndex = steps.findIndex(step => step.includes(currentStep?.split(' ')[0] || ''));
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / steps.length) * 100 : 0;

  return (
    <LoadingSpinner
      variant="large"
      message="Calculating your cosmic blueprint..."
      steps={steps}
      currentStep={currentStep}
      progress={progress}
    />
  );
}

export function ReflectionGenerationLoader({ currentStep }: { currentStep?: string }) {
  const steps = [
    "🧠 Analyzing life area influences",
    "🔮 Consulting cosmic wisdom",
    "✍️ Crafting personalized insights",
    "💫 Finalizing your reflections"
  ];

  const stepIndex = steps.findIndex(step => step.includes(currentStep?.split(' ')[1] || ''));
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / steps.length) * 100 : 0;

  return (
    <LoadingSpinner
      variant="large"
      message="Channeling your personalized insights..."
      steps={steps}
      currentStep={currentStep}
      progress={progress}
    />
  );
}

export function DataSavingLoader() {
  return (
    <LoadingSpinner
      variant="medium"
      message="💾 Saving your soul blueprint..."
      progress={75}
    />
  );
} 