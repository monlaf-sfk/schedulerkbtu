import React, { memo } from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { RECOMMENDATION_COLORS } from '../../constants/schedule';
import type { EnrichedSection, SmartRecommendation, RecommendationType } from '../../types';

interface SmartRecommendationsProps {
  readonly recommendations: readonly SmartRecommendation[];
  readonly allSections: readonly EnrichedSection[];
  readonly onApplyRecommendation: (recommendation: SmartRecommendation) => void;
}

const RECOMMENDATION_ICONS: Record<RecommendationType, React.ReactNode> = {
  conflict_resolution: <AlertTriangle size={16} className="text-red-400" />,
  completion_suggestion: <CheckCircle size={16} className="text-emerald-400" />,
  optimal_schedule: <Zap size={16} className="text-amber-400" />
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
};

const EmptyState: React.FC = () => (
  <div className="text-center py-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-600/30">
    <Lightbulb size={32} className="mx-auto mb-3 text-slate-500" />
    <p className="text-sm font-medium text-slate-400">Нет рекомендаций</p>
    <p className="text-xs text-slate-500 mt-1">Добавьте курсы для получения советов</p>
  </div>
);

interface RecommendationCardProps {
  readonly recommendation: SmartRecommendation;
  readonly suggestedSections: readonly EnrichedSection[];
  readonly onApply: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = memo(({
  recommendation,
  suggestedSections,
  onApply
}) => (
  <div className={`border rounded-xl p-4 shadow-lg transition-all duration-200 hover:shadow-xl ${RECOMMENDATION_COLORS[recommendation.type]}`}>
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        {RECOMMENDATION_ICONS[recommendation.type]}
        <span className="font-semibold text-slate-200 text-sm">
          {recommendation.title}
        </span>
      </div>
      <div className={`text-xs font-mono ${getScoreColor(recommendation.score)}`}>
        {recommendation.score}%
      </div>
    </div>

    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
      {recommendation.description}
    </p>

    {suggestedSections.length > 0 && (
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-2 font-medium">Предлагаемые секции:</div>
        <div className="space-y-2">
          {suggestedSections.slice(0, 2).map(section => (
            <div key={section.id} className="text-xs bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-600/30">
              <span className="font-semibold text-slate-200">{section.courseCode}</span>
              <span className="text-slate-300 ml-2">{section.type}</span>
              <span className="text-slate-400 ml-2">{section.day} {section.time}</span>
            </div>
          ))}
          {suggestedSections.length > 2 && (
            <div className="text-xs text-slate-400 px-2 font-medium">
              +{suggestedSections.length - 2} других секций
            </div>
          )}
        </div>
      </div>
    )}

    <button
      onClick={onApply}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
    >
      <span>Применить</span>
      <ArrowRight size={12} />
    </button>
  </div>
));

RecommendationCard.displayName = 'RecommendationCard';

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = memo(({
  recommendations,
  allSections,
  onApplyRecommendation
}) => {
  if (recommendations.length === 0) {
    return <EmptyState />;
  }

  const displayedRecommendations = recommendations.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={18} className="text-amber-400" />
        <h4 className="font-semibold text-slate-200">Умные рекомендации</h4>
      </div>

      {displayedRecommendations.map((recommendation, index) => {
        const suggestedSections = recommendation.suggestedSections
          .map(id => allSections.find(s => s.id === id))
          .filter((section): section is EnrichedSection => section !== undefined);

        return (
          <RecommendationCard
            key={`${recommendation.type}-${index}`}
            recommendation={recommendation}
            suggestedSections={suggestedSections}
            onApply={() => onApplyRecommendation(recommendation)}
          />
        );
      })}

      {recommendations.length > 3 && (
        <div className="text-center text-xs text-slate-400 py-2 font-medium">
          +{recommendations.length - 3} других рекомендаций
        </div>
      )}
    </div>
  );
});

SmartRecommendations.displayName = 'SmartRecommendations';