import { useState, useEffect } from 'react';
import { EventInstance, House, Player, EventWinner } from '../../types';
import { eventInstanceService, houseService, playerService } from '../../services/firestore';

interface ResultsRecordingModalProps {
  instance: EventInstance;
  houses: House[];
  players: Player[];
  onClose: () => void;
  onSave: () => void;
}

const ResultsRecordingModal = ({ instance, houses, players, onClose, onSave }: ResultsRecordingModalProps) => {
  const [winners, setWinners] = useState<{ position: number; winnerId: string; winnerName: string }[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<{[position: number]: string}>({});

  // Get available participants based on event type and category
  const availableParticipants = instance.type === 'individual' 
    ? players.filter(p => p.category === instance.category)
    : houses;

  useEffect(() => {
    if (instance.winners && instance.winners.length > 0) {
      const existingWinners = instance.winners.map((winner: EventWinner, index: number) => ({
        position: index + 1,
        winnerId: winner.id,
        winnerName: winner.name
      }));
      setWinners(existingWinners);
      
      const selectedMap: {[position: number]: string} = {};
      existingWinners.forEach((w: { position: number; winnerId: string; winnerName: string }) => {
        selectedMap[w.position] = w.winnerId;
      });
      setSelectedWinners(selectedMap);
    }
  }, [instance]);

  const handleWinnerSelection = (position: number, participantId: string) => {
    const participant = availableParticipants.find(p => p.id === participantId);
    if (!participant) return;

    setSelectedWinners(prev => ({
      ...prev,
      [position]: participantId
    }));

    setWinners(prev => {
      const filtered = prev.filter(w => w.position !== position);
      return [
        ...filtered,
        {
          position,
          winnerId: participantId,
          winnerName: participant.name
        }
      ].sort((a, b) => a.position - b.position);
    });
  };

  const handleSaveResults = async () => {
    try {
      const winnersData = winners.map(w => ({
        id: w.winnerId,
        name: w.winnerName
      }));

      // Update event instance with results
      await eventInstanceService.update(instance.id!, {
        winners: winnersData,
        status: 'completed',
        endTime: new Date()
      });

      // Update scores
      await updateScores(winnersData);
      
      onSave();
    } catch (error) {
      console.error('Error saving results:', error);
      alert(`Failed to save results: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateScores = async (winnersData: EventWinner[]) => {
    for (let i = 0; i < winnersData.length; i++) {
      const winner = winnersData[i];
      let points = 0;
      
      switch (i) {
        case 0: points = instance.scoring.firstPlace; break;
        case 1: points = instance.scoring.secondPlace; break;
        case 2: points = instance.scoring.thirdPlace; break;
        default: points = 0;
      }

      if (instance.type === 'individual') {
        // Update player scores
        const player = players.find(p => p.id === winner.id);
        if (player) {
          await playerService.update(winner.id, {
            ...player,
            individualScore: player.individualScore + points,
            categoryScore: player.categoryScore + points
          });

          // Update house category score
          const house = houses.find(h => h.id === player.houseId);
          if (house) {
            const updatedCategoryScores = { ...house.categoryScores };
            updatedCategoryScores[instance.category] += points;
            
            await houseService.update(player.houseId, {
              ...house,
              categoryScores: updatedCategoryScores,
              totalScore: house.totalScore + points
            });
          }
        }
      } else {
        // Update house scores directly
        const house = houses.find(h => h.id === winner.id);
        if (house) {
          const updatedCategoryScores = { ...house.categoryScores };
          updatedCategoryScores[instance.category] += points;
          
          await houseService.update(winner.id, {
            ...house,
            categoryScores: updatedCategoryScores,
            totalScore: house.totalScore + points
          });
        }
      }
    }
  };

  const getAvailableParticipants = (position: number) => {
    const alreadySelected = Object.entries(selectedWinners)
      .filter(([pos, _]) => Number(pos) !== position)
      .map(([_, id]) => id);
    
    return availableParticipants.filter(p => !alreadySelected.includes(p.id!));
  };

  const isReadOnly = instance.status === 'completed';

  return (
    <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isReadOnly ? 'View Results' : 'Record Results'} - {instance.eventName} 
              <small className="text-muted ms-2">
                ({instance.type === 'individual' ? 'Individual' : 'Group'} - {instance.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
              </small>
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              <div className="col-md-8">
                <h6 className="mb-3">Winners & Rankings</h6>
                
                {[1, 2, 3].map(position => (
                  <div key={position} className="mb-3">
                    <div className="d-flex align-items-center">
                      <div className={`badge me-3 fs-6 ${
                        position === 1 ? 'bg-warning text-dark' :
                        position === 2 ? 'bg-secondary' : 'bg-dark'
                      }`}>
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'} 
                        {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'}
                      </div>
                      
                      {isReadOnly ? (
                        <span className="form-control-plaintext">
                          {winners.find(w => w.position === position)?.winnerName || 'No winner recorded'}
                        </span>
                      ) : (
                        <select
                          className="form-select"
                          value={selectedWinners[position] || ''}
                          onChange={(e) => handleWinnerSelection(position, e.target.value)}
                        >
                          <option value="">Select {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'} place...</option>
                          {getAvailableParticipants(position).map(participant => (
                            <option key={participant.id} value={participant.id}>
                              {participant.name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <span className="ms-3 text-muted">
                        {position === 1 ? instance.scoring.firstPlace :
                         position === 2 ? instance.scoring.secondPlace :
                         instance.scoring.thirdPlace} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="col-md-4">
                <h6 className="mb-3">Event Details</h6>
                <div className="card bg-light">
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>Type:</strong> {instance.type === 'individual' ? 'Individual' : 'Group'}
                    </div>
                    <div className="mb-2">
                      <strong>Category:</strong> {instance.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="mb-2">
                      <strong>Status:</strong> 
                      <span className={`ms-2 badge ${
                        instance.status === 'scheduled' ? 'bg-primary' :
                        instance.status === 'in-progress' ? 'bg-warning' : 'bg-success'
                      }`}>
                        {instance.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-3">
                      <strong>Scoring:</strong>
                      <ul className="list-unstyled mt-1 ms-2">
                        <li>🥇 1st: {instance.scoring.firstPlace} pts</li>
                        <li>🥈 2nd: {instance.scoring.secondPlace} pts</li>
                        <li>🥉 3rd: {instance.scoring.thirdPlace} pts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {winners.length > 0 && (
              <div className="mt-4">
                <h6>Summary</h6>
                <div className="alert alert-info">
                  <div className="row">
                    {winners.map(winner => (
                      <div key={winner.position} className="col-md-4 mb-1">
                        <strong>{winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : '🥉'} {winner.winnerName}</strong>
                        <br />
                        <small className="text-muted">
                          {winner.position === 1 ? instance.scoring.firstPlace :
                           winner.position === 2 ? instance.scoring.secondPlace :
                           instance.scoring.thirdPlace} points
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSaveResults}
                disabled={winners.length === 0}
              >
                Save Results & Complete Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsRecordingModal;