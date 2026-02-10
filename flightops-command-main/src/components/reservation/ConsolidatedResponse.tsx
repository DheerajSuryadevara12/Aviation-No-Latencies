import { ReservationRequest } from '@/types/aviation';
import { CheckCircle2, Plane, Calendar, MapPin, Clock, Utensils, Wine, Fuel, Car, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ConsolidatedResponseProps {
  reservation: ReservationRequest;
}

export function ConsolidatedResponse({ reservation }: ConsolidatedResponseProps) {
  const allComplete = reservation.agents.every(a => a.status === 'success');

  if (!allComplete) return null;

  return (
    <div className="animate-fade-in p-6 rounded-xl border border-success/30 bg-gradient-to-br from-success/5 to-transparent">
      {/* Success Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Reservation Confirmed</h3>
          <p className="text-sm text-muted-foreground">All services have been arranged</p>
        </div>
      </div>

      {/* Reservation Summary */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Plane className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{reservation.flightNumber}</span>
          <span className="text-muted-foreground">•</span>
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{reservation.airport}</span>
        </div>

        <div className="flex items-center gap-2 text-foreground">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{format(reservation.requestedTime, 'EEEE, MMMM d, yyyy')}</span>
          <span className="text-muted-foreground">•</span>
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{format(reservation.requestedTime, 'h:mm a')} EST</span>
        </div>

        {/* Services */}
        <div className="pt-2 border-t border-border mt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Confirmed Services</p>
          <div className="flex flex-wrap gap-2">
            {reservation.services.catering && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">
                <Utensils className="w-3 h-3" />
                Catering
              </div>
            )}
            {reservation.services.champagne && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">
                <Wine className="w-3 h-3" />
                Champagne
              </div>
            )}
            {reservation.services.refueling && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">
                <Fuel className="w-3 h-3" />
                Refueling
              </div>
            )}
            {reservation.services.dryCleanig && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">
                <Sparkles className="w-3 h-3" />
                Dry Cleaning
              </div>
            )}
            {reservation.services.carService && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">
                <Car className="w-3 h-3" />
                Car Service
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
