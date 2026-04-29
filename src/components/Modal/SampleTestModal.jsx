import { useEffect, useState } from "react";
import { getCurrentDateTimeDefaults } from "../../utils";
import { getemployeeList, postProcessQCallocation } from "../../services/productServices";
import styled from "styled-components";
import Button from "../Button";
import { theme } from "../../styles/Theme";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-in-out;

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
  / * background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  background: ${theme.colors.primaryLight};
  color: white;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.primary}
`;

const ModalBody = styled.div`
  padding: 32px;
  overflow-y: auto;
  flex: 1;
`;

const InputSection = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const InputHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md}
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  max-width: 300px;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: ${theme.spacing.md};
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover {
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
`;

const CloseButton = styled(Button)`
  background: #f56565;
  color: white;

  &:hover {
    background: #e53e3e;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MiniCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #f7fafc;
`;

const SampleNumber = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
`;
const DropdownSection = styled.div`
  margin-bottom: 16px;
`;

const DropdownLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
`;

const ModalFooter = styled.div`
  padding: 20px 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f7fafc;
`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const Grid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SampleTestModal = ({ isOpen, onClose }) => {
  const [testNumber, setTestNumber] = useState('');
  const [cards, setCards] = useState([]);
  const [cardValues, setCardValues] = useState({});
  const { currentTime } = getCurrentDateTimeDefaults()
  const [empList, setEmpList] = useState();

  const handleClose = () => {
    setTestNumber('');
    setCards([]);
    setCardValues({});
    onClose();
  };

  useEffect(() => {
    getEmpList();
  }, [])

  const getEmpList = async () => {
    try {
      const res = await getemployeeList();
      setEmpList(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleGenerateCards = () => {
    const number = parseInt(testNumber);
    if (!number || number <= 0) return;

    // Generate cards based on the entered number
    const newCards = [];
    const timestamp = new Date().toLocaleTimeString();

    for (let i = 1; i <= number; i++) {
      newCards.push({
        id: i,
        sampleNumber: `SMP-${String(i).padStart(3, '0')}`,
        time: timestamp
      });
    }

    setCards(newCards);

    // Initialize card values
    const initialValues = {};
    const defaultEmpId = (empList && empList.length > 0) ? empList[0].emp_id : '';
    
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const currentDate = `${year}-${month}-${day}`; // Input type="date" requires YYYY-MM-DD format

    newCards.forEach(card => {
      initialValues[card.id] = {
        emp_id: defaultEmpId,
        qc_date: currentDate,
        start_time: currentTime || "10:00",
        end_time: currentTime || "10:00",
        qc_quantity: "",
        remarks: ""
      };
    });
    setCardValues(initialValues);
  };

  const handleValueChange = (cardId, field, value) => {
    setCardValues(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        qc_data: {
          call_mode: "ADD",
          po_ref_num: "PR-2026-00001",
          qc_manager_id: "EMP-001",
          qc_activity_id: "ACTIVITY-001",
          activity_list: cards.map(card => {
            const data = cardValues[card.id];
            
            // Convert YYYY-MM-DD from input back to DD-MM-YYYY if needed for API
            let formattedDate = data.qc_date;
            if (formattedDate && formattedDate.includes('-')) {
              const [y, m, d] = formattedDate.split('-');
              if (y.length === 4) {
                 formattedDate = `${d}-${m}-${y}`;
              }
            }

            return {
              qc_emp_id: data.emp_id,
              qc_date: formattedDate,
              start_time: data.start_time,
              end_time: data.end_time,
              qc_quantity: Number(data.qc_quantity),
              remarks: data.remarks
            };
          })
        }
      };

      console.log('Payload being sent:', payload);
      const response = await postProcessQCallocation(payload);
      // const response = {
      //   status: 200,
      //   message: "Success"
      // }
      if (response && response.status === 200) {
        alert('Results saved successfully!');
        handleClose();
      } else {
        alert('Failed to save results.');
      }
    } catch (error) {
      console.error('Error saving results:', error);
      alert('An error occurred while saving.');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Sample Test Management</ModalTitle>
        </ModalHeader>

        <ModalBody>
            <InputHeader>
          <InputSection>
            <DropdownLabel>Enter Number of Samples</DropdownLabel>
            <Input
              type="number"
              placeholder="e.g., 3, 5, 6"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              min="1"
            />
             </InputSection>
            <DropdownSection>
                    <DropdownLabel>Select QC Type</DropdownLabel>
                    <Select>
                      <option>Receiving QC</option>
                      <option>Grading QC</option>
                      <option>Package QC</option>
                    </Select>
                  </DropdownSection>
            <ButtonGroup>
              <Button onClick={handleGenerateCards}>
                Generate Cards
              </Button>
            </ButtonGroup>
          </InputHeader>

          {cards.length > 0 && (
            <CardsGrid>
              {cards.map((card) => (
                <MiniCard key={card.id}>
                  {/* <CardHeader>
                    <SampleNumber>{card.sampleNumber}</SampleNumber>
                  </CardHeader> */}
                <Grid2>
                  <DropdownSection>
                    <DropdownLabel>Assigned User</DropdownLabel>
                    <Select
                      value={cardValues[card.id]?.emp_id}
                      onChange={(e) => handleValueChange(card.id, 'emp_id', e.target.value)}
                    >
                      {empList?.map((emp) => (
                        <option key={emp.emp_id} value={emp.emp_id}>{emp.name}</option>
                      ))}
                    </Select>
                  </DropdownSection>

                  <DropdownSection>
                    <DropdownLabel>Date</DropdownLabel>
                    <Input 
                      type="date" 
                      value={cardValues[card.id]?.qc_date}
                      onChange={(e) => handleValueChange(card.id, 'qc_date', e.target.value)}
                    />
                  </DropdownSection>
                 </Grid2> 

                      <Grid3>
                  <DropdownSection>
                    <DropdownLabel>Start Time</DropdownLabel>
                    <Input 
                      type="time" 
                      value={cardValues[card.id]?.start_time} 
                      onChange={(e) => handleValueChange(card.id, 'start_time', e.target.value)}
                    />
                  </DropdownSection>

                   <DropdownSection>
                    <DropdownLabel>End Time</DropdownLabel>
                    <Input 
                      type="time" 
                      value={cardValues[card.id]?.end_time} 
                      onChange={(e) => handleValueChange(card.id, 'end_time', e.target.value)}
                    />
                  </DropdownSection>

                  <DropdownSection>
                    <DropdownLabel>QC Quantity</DropdownLabel>
                    <Input 
                      type="number" 
                      placeholder="Enter quantity"
                      value={cardValues[card.id]?.qc_quantity} 
                      onChange={(e) => handleValueChange(card.id, 'qc_quantity', e.target.value)}
                      min="0"
                    />
                  </DropdownSection>
                  </Grid3>

                  <DropdownSection>
                    <DropdownLabel>Remarks</DropdownLabel>
                    <Input 
                      type="text" 
                      placeholder="Add remarks"
                      value={cardValues[card.id]?.remarks} 
                      onChange={(e) => handleValueChange(card.id, 'remarks', e.target.value)}
                    />
                  </DropdownSection>
                </MiniCard>
              ))}
            </CardsGrid>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          {cards.length > 0 && (
            <Button onClick={handleSave}>Assign Employee</Button>
          )}
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};